import { useEffect, useMemo, useState } from "react"
import MapContainer from "../components/map/MapContainer"
import SearchBox from "../components/map/SearchBox"
import { useGeolocation } from "../hooks/useGeolocation"
import {
  formatDistance,
  formatDuration,
  getBestRoute,
  type RouteDetails
} from "../features/maps/directionsService"
import {
  searchPlaces,
  type PlaceSuggestion
} from "../features/maps/mapService"
import { type VehicleType } from "../features/maps/vehicleConfig"

function MapHome() {
  const location = useGeolocation()
  const [query, setQuery] = useState("")
  const [vehicleType, setVehicleType] = useState<VehicleType>("car")
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [route, setRoute] = useState<RouteDetails | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [isRouteLoading, setIsRouteLoading] = useState(false)

  const currentLocation = useMemo(() => {
    if (!location) {
      return null
    }

    return {
      latitude: location.lat,
      longitude: location.lng
    }
  }, [location])

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

    if (selectedPlace && trimmedQuery === selectedPlace.fullName) {
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
    if (!currentLocation || !selectedPlace) {
      setRoute(null)
      setIsRouteLoading(false)
      return
    }

    const controller = new AbortController()

    setIsRouteLoading(true)
    setRouteError(null)

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
  }, [currentLocation, selectedPlace, vehicleType])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setSelectedPlace(null)
    setRoute(null)
    setRouteError(null)

    if (!value.trim()) {
      setSuggestions([])
      setSearchError(null)
    }
  }

  const handleSuggestionSelect = (place: PlaceSuggestion) => {
    setSelectedPlace(place)
    setQuery(place.fullName)
    setSuggestions([])
    setSearchError(null)
  }

  if (!currentLocation) {
    return (
      <div
        style={{
          minHeight: "100vh",
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
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <MapContainer
        currentLocation={currentLocation}
        destination={selectedPlace?.coordinates ?? null}
        routeGeometry={route?.geometry ?? null}
        vehicleType={vehicleType}
      />
      <SearchBox
        destinationName={selectedPlace?.fullName ?? null}
        distance={route ? formatDistance(route.distanceMeters) : null}
        error={routeError ?? searchError}
        eta={route ? formatDuration(route.durationSeconds) : null}
        isRouteLoading={isRouteLoading}
        isSearchLoading={isSearchLoading}
        onChange={handleQueryChange}
        onSelect={handleSuggestionSelect}
        onVehicleTypeChange={setVehicleType}
        query={query}
        routeProfileLabel={route?.profileLabel ?? null}
        suggestions={suggestions}
        vehicleType={vehicleType}
      />
    </div>
  )
}

export default MapHome
