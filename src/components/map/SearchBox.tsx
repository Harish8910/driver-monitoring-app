import { useEffect, useRef, useState } from "react"
import type { PlaceSuggestion } from "../../features/maps/mapService"
import type { SearchHistoryEntry } from "../../features/maps/searchHistory"
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
  history: SearchHistoryEntry[]
  isNavigating: boolean
  isRouteLoading: boolean
  isSearchLoading: boolean
  onChange: (value: string) => void
  onOpenMenu: () => void
  onSelectHistory: (entry: SearchHistoryEntry) => void
  onStartNavigation: () => void
  onStopNavigation: () => void
  onSelect: (place: PlaceSuggestion) => void
  onVehicleTypeChange: (vehicleType: VehicleType) => void
  query: string
  routeProfileLabel: string | null
  suggestions: PlaceSuggestion[]
  theme: "light" | "dark"
  vehicleType: VehicleType
}

const containerStyle = {
  position: "fixed",
  top: 16,
  left: 16,
  width: "min(500px, calc(100vw - 32px))",
  zIndex: 6
} as const

const activeTransportColor = "#0f766e"

function formatHistoryTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Saved recently"
  }

  return date.toLocaleString([], {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short"
  })
}

function SearchBox({
  canStartNavigation,
  destinationName,
  distance,
  error,
  eta,
  guidanceDistance,
  guidanceInstruction,
  guidanceSecondaryText,
  history,
  isNavigating,
  isRouteLoading,
  isSearchLoading,
  onChange,
  onOpenMenu,
  onSelectHistory,
  onStartNavigation,
  onStopNavigation,
  onSelect,
  onVehicleTypeChange,
  query,
  routeProfileLabel,
  suggestions,
  theme,
  vehicleType
}: SearchBoxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isSearchActive, setIsSearchActive] = useState(false)
  const isDarkTheme = theme === "dark"
  const trimmedQuery = query.trim()
  const hasSuggestions = trimmedQuery.length >= 2 && suggestions.length > 0
  const recentHistory = history.slice(0, 5)
  const showPlanningUi = !isNavigating
  const hasRoutePreview = Boolean(destinationName && eta && distance)
  const showHistory =
    !isNavigating && isSearchActive && !trimmedQuery && recentHistory.length > 0
  const showSuggestionList = !isNavigating && hasSuggestions
  const showSearchSurface =
    !isNavigating && (showHistory || showSuggestionList || isSearchLoading)
  const showRouteTools = !isNavigating && Boolean(destinationName || isRouteLoading || error)
  const searchBarStyle = {
    display: "grid",
    gridTemplateColumns: "52px minmax(0, 1fr) 48px",
    alignItems: "center",
    gap: "8px",
    minHeight: "58px",
    padding: "0 10px 0 6px",
    borderRadius: "28px",
    background: isDarkTheme
      ? "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(30,41,59,0.94))"
      : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))",
    border: isDarkTheme
      ? "1px solid rgba(71, 85, 105, 0.76)"
      : "1px solid rgba(226, 232, 240, 0.92)",
    boxShadow: isDarkTheme
      ? "0 18px 38px rgba(2, 6, 23, 0.44), inset 0 1px 0 rgba(148,163,184,0.06)"
      : "0 14px 34px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255,255,255,0.9)",
    backdropFilter: "blur(16px)"
  } as const
  const iconButtonStyle = {
    width: "44px",
    height: "44px",
    borderRadius: "18px",
    border: "none",
    background: "transparent",
    color: isDarkTheme ? "#cbd5e1" : "#475569",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    padding: 0
  } as const
  const surfaceStyle = {
    background: isDarkTheme
      ? "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(30,41,59,0.95))"
      : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))",
    border: isDarkTheme
      ? "1px solid rgba(71, 85, 105, 0.76)"
      : "1px solid rgba(226, 232, 240, 0.92)",
    boxShadow: isDarkTheme
      ? "0 22px 42px rgba(2, 6, 23, 0.42)"
      : "0 20px 40px rgba(15, 23, 42, 0.14)"
  } as const
  const cardStyle = {
    border: isDarkTheme
      ? "1px solid rgba(71, 85, 105, 0.64)"
      : "1px solid rgba(226, 232, 240, 0.9)",
    background: isDarkTheme ? "rgba(15,23,42,0.84)" : "#ffffff",
    color: isDarkTheme ? "#f8fafc" : "#0f172a"
  } as const

  useEffect(() => {
    if (!isSearchActive || isNavigating) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsSearchActive(false)
      }
    }

    window.addEventListener("pointerdown", handlePointerDown)

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [isNavigating, isSearchActive])

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
        onFocus={() => setIsSearchActive(true)}
        placeholder="Search destination"
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          color: isDarkTheme ? "#e2e8f0" : "#334155",
          fontSize: "15px",
          fontWeight: 500,
          outline: "none",
          padding: "0 44px 0 2px",
          boxSizing: "border-box"
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
            color: isDarkTheme ? "#cbd5e1" : "#475569",
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

  return (
    <div ref={containerRef} style={containerStyle}>
      {!isNavigating ? (
        <>
          <div style={searchBarStyle}>
            <button
              type="button"
              aria-label="Open trip menu"
              onClick={onOpenMenu}
              style={iconButtonStyle}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  alignItems: "center"
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "2px",
                    borderRadius: "999px",
                    background: "#475569",
                    display: "block"
                  }}
                />
                <span
                  style={{
                    width: "22px",
                    height: "2px",
                    borderRadius: "999px",
                    background: "#475569",
                    display: "block"
                  }}
                />
                <span
                  style={{
                    width: "22px",
                    height: "2px",
                    borderRadius: "999px",
                    background: "#475569",
                    display: "block"
                  }}
                />
              </div>
            </button>

            <div style={{ minWidth: 0 }}>{renderSearchInput()}</div>

            <button type="button" aria-label="Search" style={iconButtonStyle}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </div>

          {showSearchSurface ? (
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                borderRadius: "24px",
                ...surfaceStyle
              }}
            >
              {showHistory ? (
                <>
                  <p
                    style={{
                      margin: "2px 4px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#94a3b8"
                    }}
                  >
                    Recent searches
                  </p>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {recentHistory.map((entry) => (
                      <button
                        key={`${entry.id}-${entry.searchedAt}`}
                        type="button"
                        onClick={() => onSelectHistory(entry)}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: "18px",
                          ...cardStyle,
                          textAlign: "left",
                          cursor: "pointer"
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            fontSize: "14px",
                            lineHeight: 1.3
                          }}
                        >
                          {entry.name}
                        </strong>
                        <span
                          style={{
                            display: "block",
                            marginTop: "4px",
                            fontSize: "12px",
                            color: isDarkTheme ? "#94a3b8" : "#64748b",
                            lineHeight: 1.4
                          }}
                        >
                          {entry.fullName}
                        </span>
                        <span
                          style={{
                            display: "block",
                            marginTop: "8px",
                            fontSize: "11px",
                            color: "#0f766e",
                            fontWeight: 700
                          }}
                        >
                          {formatHistoryTime(entry.searchedAt)}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {isSearchLoading ? (
                <p
                  style={{
                    margin: showHistory ? "12px 4px 0" : "4px",
                    color: isDarkTheme ? "#cbd5e1" : "#475569",
                    fontSize: "13px"
                  }}
                >
                  Looking for matching places...
                </p>
              ) : null}

              {showSuggestionList ? (
                <div style={{ display: "grid", gap: "8px", marginTop: showHistory ? "12px" : 0 }}>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => onSelect(suggestion)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "18px",
                        ...cardStyle,
                        textAlign: "left",
                        cursor: "pointer"
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
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
                          color: isDarkTheme ? "#94a3b8" : "#64748b",
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
          ) : null}
        </>
      ) : null}

      {showPlanningUi && showRouteTools ? (
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
                          ? `1px solid ${activeTransportColor}`
                          : isDarkTheme
                            ? "1px solid rgba(71, 85, 105, 0.64)"
                            : "1px solid rgba(203, 213, 225, 0.7)",
                        background: isActive
                          ? `linear-gradient(135deg, ${activeTransportColor}22, ${isDarkTheme ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.92)"})`
                          : isDarkTheme
                            ? "rgba(15,23,42,0.78)"
                            : "rgba(255,255,255,0.78)",
                        color: isActive
                          ? activeTransportColor
                          : isDarkTheme
                            ? "#f8fafc"
                            : "#0f172a",
                        fontWeight: 600,
                        boxShadow: isActive
                          ? `0 14px 30px ${activeTransportColor}24`
                          : isDarkTheme
                            ? "0 10px 22px rgba(2, 6, 23, 0.2)"
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
                          color: isActive
                            ? activeTransportColor
                            : isDarkTheme
                              ? "#94a3b8"
                              : "#64748b",
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
                  background: isDarkTheme
                    ? "linear-gradient(160deg, rgba(15,23,42,0.96) 0%, rgba(30,41,59,0.96) 100%)"
                    : "linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.98) 100%)",
                  border: isDarkTheme
                    ? "1px solid rgba(71, 85, 105, 0.72)"
                    : "1px solid rgba(226, 232, 240, 0.95)",
                  boxShadow: isDarkTheme
                    ? "0 20px 38px rgba(2, 6, 23, 0.32)"
                    : "0 20px 38px rgba(15, 23, 42, 0.08)",
                  color: isDarkTheme ? "#f8fafc" : "#0f172a",
                  textAlign: "left"
                }}
              >
                {isRouteLoading ? (
                  <p
                    style={{
                      margin: 0,
                      color: isDarkTheme ? "#e2e8f0" : "#334155",
                      fontWeight: 600
                    }}
                  >
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
                          background: isDarkTheme
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(15, 23, 42, 0.92)",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase"
                        }}
                      >
                        {routeProfileLabel ? `Best route for ${routeProfileLabel}` : "Best route"}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: isDarkTheme ? "#94a3b8" : "#475569",
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
                        color: isDarkTheme ? "#f8fafc" : "#0f172a"
                      }}
                    >
                      {eta}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        color: isDarkTheme ? "#e2e8f0" : "#334155",
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
                        color: isDarkTheme ? "#94a3b8" : "#475569",
                        fontSize: "14px",
                        lineHeight: 1.5
                      }}
                    >
                      {destinationName}
                    </p>
                  </>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      color: error
                        ? "#b91c1c"
                        : isDarkTheme
                          ? "#cbd5e1"
                          : "#475569",
                      lineHeight: 1.6
                    }}
                  >
                    {error ?? "Choose a destination to see the ETA and best route on the map."}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end"
                }}
              >
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
      ) : showPlanningUi ? null : (
        <div
          style={{
            marginTop: "18px",
            padding: "16px 18px",
            borderRadius: "20px",
            background: isDarkTheme ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.72)",
            border: isDarkTheme
              ? "1px solid rgba(71, 85, 105, 0.7)"
              : "1px solid rgba(226, 232, 240, 0.9)",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px"
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: isDarkTheme ? "#94a3b8" : "#64748b"
              }}
            >
              Destination locked
            </p>
            <p
              style={{
                marginTop: "8px",
                marginBottom: 0,
                color: isDarkTheme ? "#f8fafc" : "#0f172a",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: 1.4
              }}
            >
              {destinationName ?? query}
            </p>
          </div>
          <button
            type="button"
            onClick={onStopNavigation}
            style={{
              minWidth: "92px",
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
