import { useEffect, useRef } from "react"
import Map, {
  Marker,
  NavigationControl,
  type MapRef
} from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import type { LineStringGeometry } from "../../features/maps/directionsService"
import type { Coordinates } from "../../features/maps/mapService"
import { VEHICLE_CONFIG, type VehicleType } from "../../features/maps/vehicleConfig"
import RouteLayer from "./RouteLayer"

type MapContainerProps = {
  currentLocation: Coordinates
  destination: Coordinates | null
  routeGeometry: LineStringGeometry | null
  vehicleType: VehicleType
}

function MapContainer({
  currentLocation,
  destination,
  routeGeometry,
  vehicleType
}: MapContainerProps) {
  const mapRef = useRef<MapRef | null>(null)

  useEffect(() => {
    if (routeGeometry?.coordinates.length) {
      const [firstLng, firstLat] = routeGeometry.coordinates[0]
      const bounds = routeGeometry.coordinates.reduce(
        (accumulator, [longitude, latitude]) => ({
          minLng: Math.min(accumulator.minLng, longitude),
          minLat: Math.min(accumulator.minLat, latitude),
          maxLng: Math.max(accumulator.maxLng, longitude),
          maxLat: Math.max(accumulator.maxLat, latitude)
        }),
        {
          minLng: firstLng,
          minLat: firstLat,
          maxLng: firstLng,
          maxLat: firstLat
        }
      )

      mapRef.current?.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat]
        ],
        {
          padding: 90,
          duration: 1000
        }
      )

      return
    }

    mapRef.current?.flyTo({
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: 14,
      duration: 1000
    })
  }, [currentLocation, routeGeometry])

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      initialViewState={{
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        zoom: 14
      }}
      style={{ width: "100%", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
    >
      <NavigationControl position="bottom-right" />

      {routeGeometry ? (
        <RouteLayer
          color={VEHICLE_CONFIG[vehicleType].color}
          geometry={routeGeometry}
        />
      ) : null}

      <Marker
        latitude={currentLocation.latitude}
        longitude={currentLocation.longitude}
        anchor="bottom"
      >
        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "999px",
            background: "#0f766e",
            border: "3px solid #ffffff",
            boxShadow: "0 0 0 6px rgba(15, 118, 110, 0.2)"
          }}
        />
      </Marker>

      {destination ? (
        <Marker
          latitude={destination.latitude}
          longitude={destination.longitude}
          anchor="bottom"
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "6px 6px 6px 0",
              background: "#dc2626",
              transform: "rotate(-45deg)",
              border: "3px solid #ffffff"
            }}
          />
        </Marker>
      ) : null}
    </Map>
  )
}

export default MapContainer
