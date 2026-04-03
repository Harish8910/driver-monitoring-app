import { useEffect, useRef, useState } from "react"
import type { PlaceSuggestion } from "../../features/maps/mapService"
import {
  VEHICLE_OPTIONS,
  type VehicleType
} from "../../features/maps/vehicleConfig"

type SearchBoxProps = {
  canStartNavigation: boolean
  destinationName: string | null
  distance: string | null
  error: string | null
  eta: string | null
  guidanceDistance: string | null
  guidanceInstruction: string | null
  guidanceSecondaryText: string | null
  isNavigating: boolean
  isRouteLoading: boolean
  isSearchLoading: boolean
  onChange: (value: string) => void
  onCollapseRequest?: () => void
  onStartNavigation: () => void
  onStopNavigation: () => void
  onSelect: (place: PlaceSuggestion) => void
  onVehicleTypeChange: (vehicleType: VehicleType) => void
  panelOffsetLeft?: number
  query: string
  routeProfileLabel: string | null
  suggestions: PlaceSuggestion[]
  vehicleType: VehicleType
  collapseToken?: number
}

const panelStyle = {
  position: "fixed",
  top: 16,
  left: 20,
  right: 12,
  width: "auto",
  maxWidth: "390px",
  maxHeight: "calc(100vh - 32px)",
  overflowY: "auto",
  padding: "20px",
  borderRadius: "28px",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 42%, rgba(240,249,255,0.9) 100%)",
  border: "1px solid rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px)",
  boxShadow:
    "0 32px 80px rgba(15, 23, 42, 0.22), inset 0 1px 0 rgba(255,255,255,0.7)",
  color: "#0f172a",
  zIndex: 1,
  boxSizing: "border-box"
} as const

const inputStyle = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: "18px",
  border: "1px solid rgba(148, 163, 184, 0.26)",
  background: "rgba(255,255,255,0.92)",
  color: "#0f172a",
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "0.01em",
  boxSizing: "border-box"
} as const

const VEHICLE_ACTIVE_COLOR = "#0f766e"

function SearchBox({
  canStartNavigation,
  destinationName,
  distance,
  error,
  eta,
  guidanceDistance,
  guidanceInstruction,
  guidanceSecondaryText,
  isNavigating,
  isRouteLoading,
  isSearchLoading,
  onChange,
  onCollapseRequest,
  onStartNavigation,
  onStopNavigation,
  onSelect,
  onVehicleTypeChange,
  collapseToken = 0,
  panelOffsetLeft = 20,
  query,
  routeProfileLabel,
  suggestions,
  vehicleType
}: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isPanelExpanded, setIsPanelExpanded] = useState(false)
  const trimmedQuery = query.trim()
  const hasSuggestions = trimmedQuery.length >= 2 && suggestions.length > 0
  const showPlanningUi = !isNavigating
  const hasRoutePreview = Boolean(destinationName && eta && distance)
  const showRouteTools = Boolean(trimmedQuery || hasRoutePreview || isRouteLoading || error)
  const resolvedPanelStyle = {
    ...panelStyle,
    left: panelOffsetLeft
  }

  useEffect(() => {
    if (isNavigating) {
      setIsPanelExpanded(true)
    }
  }, [isNavigating])

  useEffect(() => {
    if (trimmedQuery || destinationName || canStartNavigation) {
      setIsPanelExpanded(true)
    }
  }, [canStartNavigation, destinationName, trimmedQuery])

  useEffect(() => {
    if (!isNavigating && isPanelExpanded) {
      window.setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelectionRange(query.length, query.length)
      }, 20)
    }
  }, [isNavigating, isPanelExpanded, query.length])

  useEffect(() => {
    if (!trimmedQuery && !destinationName && !canStartNavigation && !isNavigating) {
      setIsPanelExpanded(false)
    }
  }, [canStartNavigation, collapseToken, destinationName, isNavigating, trimmedQuery])

  const collapsePlanner = () => {
    setIsPanelExpanded(false)
    onCollapseRequest?.()
  }

  const clearSearch = () => {
    onChange("")
    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 20)
  }

  const renderSearchInput = () => (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsPanelExpanded(true)}
        placeholder="Search destination"
        style={{
          ...inputStyle,
          paddingRight: "46px"
        }}
      />
      {trimmedQuery ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clearSearch}
          style={{
            position: "absolute",
            top: "50%",
            right: "14px",
            transform: "translateY(-50%)",
            width: "28px",
            height: "28px",
            borderRadius: "999px",
            border: "none",
            background: "rgba(148, 163, 184, 0.14)",
            color: "#475569",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 700,
            display: "grid",
            placeItems: "center"
          }}
        >
          x
        </button>
      ) : null}
    </div>
  )

  if (!isNavigating && !isPanelExpanded) {
    return (
      <div
        style={{
          ...resolvedPanelStyle,
          top: 20,
          right: "auto",
          width: "min(240px, calc(100vw - 104px))",
          maxWidth: "240px",
          maxHeight: "none",
          overflow: "visible",
          padding: 0,
          borderRadius: "18px",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)",
          boxShadow:
            "0 20px 44px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255,255,255,0.8)"
        }}
      >
        {renderSearchInput()}
      </div>
    )
  }

  return (
    <div style={resolvedPanelStyle}>
      {isNavigating ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            alignItems: "center",
            gap: "12px",
            textAlign: "left"
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: "8px",
                color: "#0f172a",
                fontSize: "28px",
                lineHeight: 1
              }}
            >
              Drive with guidance
            </h2>
            <p
              style={{
                color: "#475569",
                fontSize: "14px",
                lineHeight: 1.5,
                margin: 0
              }}
            >
              Search is hidden while navigation is active so you can stay focused on the route.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "8px",
              flexShrink: 0
            }}
          >
            <button
              type="button"
              onClick={onStopNavigation}
              style={{
                minWidth: "86px",
                padding: "14px 18px",
                borderRadius: "18px",
                border: "none",
                background: "linear-gradient(135deg, #0f172a, #334155)",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 18px 32px rgba(15, 23, 42, 0.24)"
              }}
            >
              Stop
            </button>
            <span
              style={{
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#64748b",
                fontWeight: 700
              }}
            >
              Live
            </span>
          </div>
        </div>
      ) : null}

      {showPlanningUi ? (
        <>
          <div style={{ marginTop: isNavigating ? "18px" : 0 }}>
            {renderSearchInput()}

            {isSearchLoading ? (
              <p
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  textAlign: "left",
                  color: "#475569",
                  fontSize: "13px"
                }}
              >
                Looking for matching places...
              </p>
            ) : null}

            {hasSuggestions ? (
              <div
                style={{
                  marginTop: "12px",
                  borderRadius: "18px",
                  border: "1px solid rgba(226, 232, 240, 0.85)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))",
                  overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)"
                }}
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => onSelect(suggestion)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "none",
                      borderBottom:
                        index === suggestions.length - 1
                          ? "none"
                          : "1px solid rgba(226, 232, 240, 0.9)",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#0f172a"
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color: "#0f172a",
                        fontSize: "15px",
                        lineHeight: 1.3,
                        overflowWrap: "anywhere"
                      }}
                    >
                      {suggestion.name}
                    </strong>
                    <span
                      style={{
                        display: "block",
                        marginTop: "4px",
                        fontSize: "13px",
                        color: "#64748b",
                        lineHeight: 1.4,
                        overflowWrap: "anywhere"
                      }}
                    >
                      {suggestion.fullName}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {showRouteTools ? (
            <div
              style={{
                marginTop: "18px",
                display: "grid",
                gap: "12px"
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "10px"
                }}
              >
                {VEHICLE_OPTIONS.map((option) => {
                  const isActive = option.value === vehicleType

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onVehicleTypeChange(option.value)}
                      style={{
                        padding: "14px 12px",
                        borderRadius: "18px",
                        border: isActive
                          ? `1px solid ${VEHICLE_ACTIVE_COLOR}`
                          : "1px solid rgba(203, 213, 225, 0.7)",
                        background: isActive
                          ? "linear-gradient(135deg, rgba(15,118,110,0.12), rgba(255,255,255,0.92))"
                          : "rgba(255,255,255,0.78)",
                        color: isActive ? VEHICLE_ACTIVE_COLOR : "#0f172a",
                        fontWeight: 600,
                        boxShadow: isActive
                          ? "0 14px 30px rgba(15,118,110,0.15)"
                          : "0 8px 18px rgba(15, 23, 42, 0.06)",
                        cursor: "pointer",
                        minWidth: 0
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          marginTop: "2px",
                          fontSize: "12px",
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: isActive ? VEHICLE_ACTIVE_COLOR : "#64748b",
                          overflowWrap: "anywhere"
                        }}
                      >
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div
                style={{
                  padding: "18px",
                  borderRadius: "24px",
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.98) 100%)",
                  border: "1px solid rgba(226, 232, 240, 0.95)",
                  boxShadow: "0 20px 38px rgba(15, 23, 42, 0.08)",
                  color: "#0f172a",
                  textAlign: "left"
                }}
              >
                {isRouteLoading ? (
                  <p style={{ margin: 0, color: "#334155", fontWeight: 600 }}>
                    Finding the fastest available route...
                  </p>
                ) : hasRoutePreview ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px"
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          padding: "7px 10px",
                          borderRadius: "999px",
                          background: "rgba(15, 23, 42, 0.92)",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase"
                        }}
                      >
                        {`Best route for ${routeProfileLabel}`}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: "#475569",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase"
                        }}
                      >
                        Live ETA
                      </p>
                    </div>
                    <h3
                      style={{
                        margin: "14px 0 6px",
                        fontSize: "34px",
                        lineHeight: 1,
                        color: "#0f172a"
                      }}
                    >
                      {eta}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        color: "#334155",
                        fontSize: "15px",
                        fontWeight: 600
                      }}
                    >
                      {distance} remaining
                    </p>
                    <p
                      style={{
                        marginTop: "14px",
                        marginBottom: 0,
                        color: "#475569",
                        fontSize: "14px",
                        lineHeight: 1.5
                      }}
                    >
                      {destinationName}
                    </p>
                  </>
                ) : (
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    {error ?? "Choose a destination to see the ETA and best route on the map."}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px"
                }}
              >
                <button
                  type="button"
                  onClick={collapsePlanner}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#64748b",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Minimize
                </button>
                <button
                  type="button"
                  onClick={onStartNavigation}
                  disabled={!canStartNavigation}
                  style={{
                    minWidth: "86px",
                    padding: "14px 18px",
                    borderRadius: "18px",
                    border: "none",
                    background: "linear-gradient(135deg, #0f766e, #0ea5e9)",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: !canStartNavigation ? "not-allowed" : "pointer",
                    opacity: !canStartNavigation ? 0.45 : 1,
                    boxShadow: "0 18px 32px rgba(15, 118, 110, 0.24)"
                  }}
                >
                  Go
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div
          style={{
            marginTop: "18px",
            padding: "16px 18px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(226, 232, 240, 0.9)",
            textAlign: "left"
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#64748b"
            }}
          >
            Destination locked
          </p>
          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "#0f172a",
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: 1.4
            }}
          >
            {destinationName ?? query}
          </p>
        </div>
      )}

      {isNavigating && guidanceInstruction ? (
        <div
          style={{
            marginTop: "18px",
            padding: "18px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            boxShadow: "0 20px 38px rgba(15, 23, 42, 0.24)",
            textAlign: "left"
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.72
            }}
          >
            Next maneuver
          </p>
          <h3
            style={{
              margin: "12px 0 8px",
              color: "#ffffff",
              fontSize: "24px",
              lineHeight: 1.2
            }}
          >
            {guidanceDistance ? `${guidanceDistance}: ` : ""}
            {guidanceInstruction}
          </h3>
          {guidanceSecondaryText ? (
            <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
              {guidanceSecondaryText}
            </p>
          ) : null}
        </div>
      ) : null}

      {error && isNavigating ? (
        <p
          style={{
            marginTop: "14px",
            marginBottom: 0,
            color: "#b91c1c",
            textAlign: "left",
            fontSize: "13px",
            fontWeight: 600
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default SearchBox
