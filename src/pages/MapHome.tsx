import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import MapContainer from "../components/map/MapContainer"
import MapSidebar from "../components/map/MapSidebar"
import AlertOverlay from "../components/monitoring/AlertOverlay"
import CameraView from "../components/monitoring/CameraView"
import SearchBox from "../components/map/SearchBox"
import { stopAlertBeep } from "../features/alerts/beep"
import {
  speakNavigationAlert,
  stopVoiceAlerts
} from "../features/alerts/voiceAlert"
import { signOut } from "../features/auth/authService"
import { useGeolocation } from "../hooks/useGeolocation"
import {
  formatDistance,
  formatDuration,
  getBestRoute,
  getDistanceBetweenCoordinates,
  getNextNavigationGuidance,
  type RouteDetails
} from "../features/maps/directionsService"
import {
  getAttentionMessage
} from "../features/monitoring/behaviorAnalysis"
import { useMonitoring } from "../features/monitoring/useMonitoring"
import {
  addSearchHistoryEntry,
  loadSearchHistory,
  saveSearchHistory,
  type SearchHistoryEntry
} from "../features/maps/searchHistory"
import {
  searchPlaces,
  type Coordinates,
  type PlaceSuggestion
} from "../features/maps/mapService"
import { type VehicleType } from "../features/maps/vehicleConfig"

function MapHome() {
  const navigate = useNavigate()
  const location = useGeolocation()
  const [query, setQuery] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>(() =>
    loadSearchHistory()
  )
  const [vehicleType, setVehicleType] = useState<VehicleType>("car")
  const [previewOrigin, setPreviewOrigin] = useState<Coordinates | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [route, setRoute] = useState<RouteDetails | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [isRouteLoading, setIsRouteLoading] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(false)
  const [isMonitoringPromptOpen, setIsMonitoringPromptOpen] = useState(false)
  const lastNavigationRefreshRef = useRef<{
    location: Coordinates
    requestedAt: number
  } | null>(null)
  const lastSpokenStepRef = useRef<string | null>(null)
  const hasAnnouncedArrivalRef = useRef(false)
  const monitoring = useMonitoring({
    enabled: isNavigating && isMonitoringEnabled
  })

  const currentLocation = useMemo(() => {
    if (!location) {
      return null
    }

    return {
      latitude: location.lat,
      longitude: location.lng
    }
  }, [location])
  const guidance = useMemo(
    () => (route && isNavigating ? getNextNavigationGuidance(route) : null),
    [isNavigating, route]
  )
  const monitoringMessage = useMemo(() => {
    if (!isNavigating || !isMonitoringEnabled) {
      return null
    }

    if (monitoring.lastAlert && Date.now() - monitoring.lastAlert.timestamp < 4500) {
      return monitoring.lastAlert.label
    }

    if (monitoring.currentState !== "attentive") {
      return getAttentionMessage(monitoring.currentState)
    }

    if (monitoring.status === "camera-denied") {
      return "Camera permission denied for driver monitoring"
    }

    if (monitoring.status === "unsupported") {
      return "Driver monitoring is not supported on this browser"
    }

    return null
  }, [
    isMonitoringEnabled,
    isNavigating,
    monitoring.currentState,
    monitoring.lastAlert,
    monitoring.status
  ])

  useEffect(() => {
    if (!currentLocation) {
      return
    }

    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 2) {
      setSuggestions([])
      setIsSearchLoading(false)
      return
    }

    if (
      selectedPlace &&
      (trimmedQuery === selectedPlace.fullName || trimmedQuery === selectedPlace.name)
    ) {
      setSuggestions([])
      setIsSearchLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setIsSearchLoading(true)
      setSearchError(null)

      try {
        const results = await searchPlaces(
          trimmedQuery,
          currentLocation,
          controller.signal
        )
        setSuggestions(results)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }

        setSearchError(
          error instanceof Error
            ? error.message
            : "We couldn't load destination suggestions."
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchLoading(false)
        }
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [currentLocation, query, selectedPlace])

  useEffect(() => {
    if (!previewOrigin || !selectedPlace || isNavigating) {
      return
    }

    const controller = new AbortController()

    setIsRouteLoading(true)
    setRouteError(null)

    void getBestRoute(
      previewOrigin,
      selectedPlace.coordinates,
      vehicleType,
      controller.signal
    )
      .then((nextRoute) => {
        setRoute(nextRoute)
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }

        setRoute(null)
        setRouteError(
          error instanceof Error
            ? error.message
            : "We couldn't calculate a route right now."
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsRouteLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [isNavigating, previewOrigin, selectedPlace, vehicleType])

  useEffect(() => {
    if (!currentLocation || !selectedPlace || !isNavigating) {
      return
    }

    const distanceToDestination = getDistanceBetweenCoordinates(
      currentLocation,
      selectedPlace.coordinates
    )

    if (distanceToDestination <= 25) {
      setIsNavigating(false)
      setIsRouteLoading(false)
      setIsMonitoringEnabled(false)
      setIsMonitoringPromptOpen(false)
      lastNavigationRefreshRef.current = null
      lastSpokenStepRef.current = null

      if (!hasAnnouncedArrivalRef.current) {
        hasAnnouncedArrivalRef.current = true
        speakNavigationAlert(`You have arrived at ${selectedPlace.name}`)
      }

      return
    }

    const previousRefresh = lastNavigationRefreshRef.current
    const movedSinceLastRefresh = previousRefresh
      ? getDistanceBetweenCoordinates(previousRefresh.location, currentLocation)
      : Number.POSITIVE_INFINITY
    const elapsedSinceLastRefresh = previousRefresh
      ? Date.now() - previousRefresh.requestedAt
      : Number.POSITIVE_INFINITY

    if (route && movedSinceLastRefresh < 25 && elapsedSinceLastRefresh < 6000) {
      return
    }

    const controller = new AbortController()

    setIsRouteLoading(true)
    setRouteError(null)
    lastNavigationRefreshRef.current = {
      location: currentLocation,
      requestedAt: Date.now()
    }

    void getBestRoute(
      currentLocation,
      selectedPlace.coordinates,
      vehicleType,
      controller.signal
    )
      .then((nextRoute) => {
        setRoute(nextRoute)
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }

        setRouteError(
          error instanceof Error
            ? error.message
            : "We couldn't update the live navigation route."
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsRouteLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [currentLocation, isNavigating, route, selectedPlace, vehicleType])

  useEffect(() => {
    if (!isNavigating || !guidance) {
      return
    }

    if (
      guidance.stepKey === lastSpokenStepRef.current ||
      (lastSpokenStepRef.current && guidance.distanceMeters > 120)
    ) {
      return
    }

    lastSpokenStepRef.current = guidance.stepKey
    speakNavigationAlert(guidance.voiceText)
  }, [guidance, isNavigating])

  useEffect(() => {
    return () => {
      stopVoiceAlerts()
    }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setIsSidebarOpen(false)
    setSelectedPlace(null)
    setPreviewOrigin(null)
    setRoute(null)
    setRouteError(null)
    setIsNavigating(false)
    setIsMonitoringEnabled(false)
    setIsMonitoringPromptOpen(false)
    lastNavigationRefreshRef.current = null
    lastSpokenStepRef.current = null
    hasAnnouncedArrivalRef.current = false
    stopAlertBeep()
    stopVoiceAlerts()

    if (!value.trim()) {
      setSuggestions([])
      setSearchError(null)
    }
  }

  const handleSuggestionSelect = (
    place: PlaceSuggestion,
    nextVehicleType = vehicleType,
    shouldSaveHistory = true
  ) => {
    if (shouldSaveHistory) {
      const nextSearchHistory = addSearchHistoryEntry(
        searchHistory,
        place,
        nextVehicleType
      )

      setSearchHistory(nextSearchHistory)
      saveSearchHistory(nextSearchHistory)
    }

    setVehicleType(nextVehicleType)
    setSelectedPlace(place)
    setPreviewOrigin(currentLocation)
    setQuery(place.name)
    setSuggestions([])
    setSearchError(null)
    setRouteError(null)
    setIsSidebarOpen(false)
    setIsNavigating(false)
    setIsMonitoringEnabled(false)
    setIsMonitoringPromptOpen(false)
    lastNavigationRefreshRef.current = null
    lastSpokenStepRef.current = null
    hasAnnouncedArrivalRef.current = false
    stopAlertBeep()
    stopVoiceAlerts()
  }

  const handleHistorySelect = (entry: SearchHistoryEntry) => {
    handleSuggestionSelect({
      coordinates: entry.coordinates,
      fullName: entry.fullName,
      id: entry.id,
      name: entry.name
    }, entry.vehicleType, false)
  }

  const handleStartNavigation = () => {
    if (!currentLocation || !selectedPlace) {
      return
    }

    setIsMonitoringPromptOpen(true)
  }

  const beginNavigation = (enableMonitoring: boolean) => {
    if (!currentLocation || !selectedPlace) {
      return
    }

    setIsMonitoringPromptOpen(false)
    setIsNavigating(true)
    setIsMonitoringEnabled(enableMonitoring)
    setPreviewOrigin(currentLocation)
    setRouteError(null)
    lastNavigationRefreshRef.current = null
    lastSpokenStepRef.current = null
    hasAnnouncedArrivalRef.current = false
    speakNavigationAlert(
      enableMonitoring
        ? `Navigation started. Driver monitoring assistance enabled for ${selectedPlace.name}`
        : `Navigation started to ${selectedPlace.name}`
    )
  }

  const handleStopNavigation = () => {
    setIsNavigating(false)
    setIsMonitoringEnabled(false)
    setIsMonitoringPromptOpen(false)
    setPreviewOrigin(currentLocation)
    setRouteError(null)
    setIsSidebarOpen(false)
    lastNavigationRefreshRef.current = null
    lastSpokenStepRef.current = null
    hasAnnouncedArrivalRef.current = false
    stopAlertBeep()
    stopVoiceAlerts()
  }

  const handleClearHistory = () => {
    setSearchHistory([])
    saveSearchHistory([])
  }

  const handleLogout = async () => {
    setIsMonitoringEnabled(false)
    setIsMonitoringPromptOpen(false)
    stopAlertBeep()
    stopVoiceAlerts()
    await signOut()
    navigate("/")
  }

  if (!currentLocation) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background:
            "linear-gradient(135deg, rgba(226, 232, 240, 0.7), rgba(255, 255, 255, 1))"
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            padding: "28px",
            borderRadius: "24px",
            background: "#ffffff",
            boxShadow: "0 24px 48px rgba(15, 23, 42, 0.12)"
          }}
        >
          <h2>Enable location to continue</h2>
          <p style={{ marginTop: "10px" }}>
            Your live location is needed before we can suggest destinations and
            calculate the fastest route.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#e2e8f0"
      }}
    >
      <button
        type="button"
        aria-label="Open trip menu"
        onClick={() => setIsSidebarOpen(true)}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          width: "56px",
          height: "56px",
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.72)",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)",
          backdropFilter: "blur(20px)",
          boxShadow:
            "0 20px 44px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
          color: "#0f172a",
          cursor: "pointer",
          zIndex: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px"
        }}
      >
        <span
          style={{
            width: "20px",
            height: "2px",
            borderRadius: "999px",
            background: "#0f172a",
            display: "block"
          }}
        />
        <span
          style={{
            width: "20px",
            height: "2px",
            borderRadius: "999px",
            background: "#0f172a",
            display: "block"
          }}
        />
        <span
          style={{
            width: "20px",
            height: "2px",
            borderRadius: "999px",
            background: "#0f172a",
            display: "block"
          }}
        />
      </button>
      <MapSidebar
        history={searchHistory}
        isOpen={isSidebarOpen}
        onClearHistory={handleClearHistory}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        onSelectHistory={handleHistorySelect}
      />
      <MapContainer
        currentLocation={currentLocation}
        destination={selectedPlace?.coordinates ?? null}
        heading={location?.heading ?? null}
        isNavigating={isNavigating}
        routeGeometry={route?.geometry ?? null}
        vehicleType={vehicleType}
      />
      {isMonitoringPromptOpen ? (
        <>
          <button
            type="button"
            aria-label="Close monitoring prompt"
            onClick={() => setIsMonitoringPromptOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              border: "none",
              background: "rgba(15, 23, 42, 0.24)",
              backdropFilter: "blur(4px)",
              zIndex: 10
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(440px, calc(100vw - 32px))",
              padding: "24px",
              borderRadius: "28px",
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
              boxShadow: "0 32px 70px rgba(15, 23, 42, 0.22)",
              zIndex: 11
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#0f766e"
              }}
            >
              Optional safety layer
            </p>
            <h2
              style={{
                marginTop: "12px",
                marginBottom: "10px",
                color: "#0f172a",
                fontSize: "30px",
                lineHeight: 1.05
              }}
            >
              Enable monitoring assistance?
            </h2>
            <p
              style={{
                margin: 0,
                color: "#475569",
                lineHeight: 1.6
              }}
            >
              If enabled, the front camera will monitor whether the driver is
              facing forward and whether their eyes appear closed for too long.
              We will ask for camera permission before monitoring starts, and a
              beep plus on-screen reason will appear when attention drops.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginTop: "20px"
              }}
            >
              <button
                type="button"
                onClick={() => beginNavigation(false)}
                style={{
                  padding: "14px 16px",
                  borderRadius: "18px",
                  border: "1px solid rgba(203, 213, 225, 0.9)",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => beginNavigation(true)}
                style={{
                  padding: "14px 16px",
                  borderRadius: "18px",
                  border: "none",
                  background: "linear-gradient(135deg, #0f766e, #0ea5e9)",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 18px 32px rgba(15, 118, 110, 0.24)"
                }}
              >
                Enable assistance
              </button>
            </div>
          </div>
        </>
      ) : null}
      {isNavigating && isMonitoringEnabled ? (
        <>
          <CameraView
            attentionState={monitoring.currentState}
            status={monitoring.status}
            videoRef={monitoring.videoRef}
          />
          <AlertOverlay message={monitoringMessage} />
        </>
      ) : null}
      <SearchBox
        canStartNavigation={Boolean(selectedPlace && route && !isRouteLoading)}
        destinationName={selectedPlace?.fullName ?? null}
        distance={route ? formatDistance(route.distanceMeters) : null}
        error={routeError ?? searchError}
        eta={route ? formatDuration(route.durationSeconds) : null}
        guidanceDistance={guidance?.distanceLabel ?? null}
        guidanceInstruction={guidance?.instruction ?? null}
        guidanceSecondaryText={guidance?.secondaryText ?? null}
        isNavigating={isNavigating}
        isRouteLoading={isRouteLoading}
        isSearchLoading={isSearchLoading}
        onChange={handleQueryChange}
        onStartNavigation={handleStartNavigation}
        onStopNavigation={handleStopNavigation}
        onSelect={handleSuggestionSelect}
        onVehicleTypeChange={setVehicleType}
        panelOffsetLeft={92}
        query={query}
        routeProfileLabel={route?.profileLabel ?? null}
        suggestions={suggestions}
        vehicleType={vehicleType}
      />
    </div>
  )
}

export default MapHome
