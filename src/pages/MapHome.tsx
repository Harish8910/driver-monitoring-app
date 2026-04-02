import MapContainer from "../components/map/MapContainer"
import { useGeolocation } from "../hooks/useGeolocation"
import { useState } from "react"

function MapHome() {
  const location = useGeolocation()
  const [permissionAsked, setPermissionAsked] = useState(false)

  if (!location) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>📍 Enable Location to Continue</h2>
        <button onClick={() => setPermissionAsked(true)}>
          Enable Location
        </button>
      </div>
    )
  }

  return (
    <div>
      <MapContainer
        latitude={location.lat}
        longitude={location.lng}
      />

      {/* UI Overlay */}
      <div style={{
        position: "absolute",
        top: 20,
        left: 20,
        background: "white",
        padding: "10px",
        borderRadius: "8px"
      }}>
        <input
          placeholder="Search destination..."
          style={{ padding: "8px", width: "200px" }}
        />

        <div style={{ marginTop: "10px" }}>
          <button>🚗 Car</button>
          <button>🏍 Bike</button>
          <button>🚶 Walk</button>
        </div>

        <button style={{ marginTop: "10px" }}>
          Start Journey
        </button>
      </div>
    </div>
  )
}

export default MapHome