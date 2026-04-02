import type { PlaceSuggestion } from "../../features/maps/mapService"
import {
  VEHICLE_OPTIONS,
  type VehicleType
} from "../../features/maps/vehicleConfig"

type SearchBoxProps = {
  destinationName: string | null
  distance: string | null
  error: string | null
  eta: string | null
  isRouteLoading: boolean
  isSearchLoading: boolean
  onChange: (value: string) => void
  onSelect: (place: PlaceSuggestion) => void
  onVehicleTypeChange: (vehicleType: VehicleType) => void
  query: string
  routeProfileLabel: string | null
  suggestions: PlaceSuggestion[]
  vehicleType: VehicleType
}

const panelStyle = {
  position: "absolute",
  top: 20,
  left: 20,
  width: "min(360px, calc(100vw - 40px))",
  padding: "18px",
  borderRadius: "20px",
  background:
    "linear-gradient(180deg, rgba(248,250,252,0.96) 0%, rgba(255,255,255,0.92) 100%)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 24px 48px rgba(15, 23, 42, 0.18)",
  zIndex: 1
} as const

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(148, 163, 184, 0.6)",
  fontSize: "15px",
  boxSizing: "border-box"
} as const

function SearchBox({
  destinationName,
  distance,
  error,
  eta,
  isRouteLoading,
  isSearchLoading,
  onChange,
  onSelect,
  onVehicleTypeChange,
  query,
  routeProfileLabel,
  suggestions,
  vehicleType
}: SearchBoxProps) {
  const hasSuggestions = query.trim().length >= 2 && suggestions.length > 0

  return (
    <div style={panelStyle}>
      <div style={{ textAlign: "left" }}>
        <p
          style={{
            fontSize: "12px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#475569"
          }}
        >
          Destination Search
        </p>
        <h2 style={{ marginTop: "6px", marginBottom: "12px" }}>
          Plan the best route
        </h2>
      </div>

      <div style={{ position: "relative" }}>
        <input
          value={query}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search destination..."
          style={inputStyle}
        />

        {isSearchLoading ? (
          <p style={{ marginTop: "8px", textAlign: "left", color: "#475569" }}>
            Looking for matching places...
          </p>
        ) : null}

        {hasSuggestions ? (
          <div
            style={{
              marginTop: "10px",
              borderRadius: "16px",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              background: "#ffffff",
              overflow: "hidden",
              boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)"
            }}
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => onSelect(suggestion)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "none",
                  borderBottom:
                    index === suggestions.length - 1
                      ? "none"
                      : "1px solid rgba(226, 232, 240, 0.85)",
                  background: "#ffffff",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <strong style={{ display: "block", color: "#0f172a" }}>
                  {suggestion.name}
                </strong>
                <span style={{ fontSize: "13px", color: "#475569" }}>
                  {suggestion.fullName}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
          marginTop: "14px"
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
                padding: "11px 10px",
                borderRadius: "14px",
                border: isActive
                  ? `1px solid ${option.color}`
                  : "1px solid rgba(148, 163, 184, 0.45)",
                background: isActive ? `${option.color}18` : "#ffffff",
                color: isActive ? option.color : "#0f172a",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {option.icon}
            </button>
          )
        })}
      </div>

      <div
        style={{
          marginTop: "16px",
          padding: "14px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
          textAlign: "left"
        }}
      >
        {isRouteLoading ? (
          <p>Finding the fastest available route...</p>
        ) : destinationName && eta && distance ? (
          <>
            <p style={{ fontSize: "12px", letterSpacing: "0.06em", opacity: 0.72 }}>
              BEST ROUTE FOR {routeProfileLabel?.toUpperCase()}
            </p>
            <h3 style={{ margin: "6px 0 8px", fontSize: "20px" }}>{eta}</h3>
            <p style={{ opacity: 0.84 }}>{distance} remaining</p>
            <p style={{ marginTop: "10px", opacity: 0.84 }}>{destinationName}</p>
          </>
        ) : (
          <p>Choose a destination to see the ETA and best route on the map.</p>
        )}
      </div>

      {error ? (
        <p style={{ marginTop: "12px", color: "#b91c1c", textAlign: "left" }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default SearchBox
