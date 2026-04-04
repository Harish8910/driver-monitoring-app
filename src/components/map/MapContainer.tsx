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
  heading: number | null
  isNavigating: boolean
  onMapPress?: () => void
  routeGeometry: LineStringGeometry | null
  theme: "light" | "dark"
  vehicleType: VehicleType
}

function getRouteBearing(routeGeometry: LineStringGeometry | null) {
  if (!routeGeometry || routeGeometry.coordinates.length < 2) {
    return null
  }

  const [startLongitude, startLatitude] = routeGeometry.coordinates[0]
  const [endLongitude, endLatitude] = routeGeometry.coordinates[1]
  const startLatitudeRadians = (startLatitude * Math.PI) / 180
  const endLatitudeRadians = (endLatitude * Math.PI) / 180
  const longitudeDeltaRadians = ((endLongitude - startLongitude) * Math.PI) / 180
  const y = Math.sin(longitudeDeltaRadians) * Math.cos(endLatitudeRadians)
  const x =
    Math.cos(startLatitudeRadians) * Math.sin(endLatitudeRadians) -
    Math.sin(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.cos(longitudeDeltaRadians)

  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360
}

const cameraEasing = (progress: number) => 1 - Math.pow(1 - progress, 3)
const darkWaterColor = "#3b82f6"
const darkRoadColor = "rgba(248, 250, 252, 0.24)"
const darkMajorRoadColor = "rgba(255, 255, 255, 0.38)"
const darkBackgroundColor = "#101214"

function safelySetPaintProperty(
  map: ReturnType<NonNullable<MapRef["getMap"]>>,
  layerId: string,
  property: string,
  value: string | number
) {
  try {
    map.setPaintProperty(layerId, property, value)
  } catch {
    // Ignore layers that do not support this paint property.
  }
}

function MapContainer({
  currentLocation,
  destination,
  heading,
  isNavigating,
  onMapPress,
  routeGeometry,
  theme,
  vehicleType
}: MapContainerProps) {
  const mapRef = useRef<MapRef | null>(null)

  useEffect(() => {
    if (theme !== "dark") {
      return
    }

    const map = mapRef.current?.getMap()

    if (!map) {
      return
    }

    const applyDarkThemeTweaks = () => {
      if (!map.isStyleLoaded()) {
        return
      }

      const layers = map.getStyle()?.layers ?? []

      layers.forEach((layer) => {
        const layerId = layer.id.toLowerCase()

        if (layer.type === "background" && layerId.includes("background")) {
          safelySetPaintProperty(map, layer.id, "background-color", darkBackgroundColor)
        }

        if (layer.type === "fill" && layerId.includes("water")) {
          safelySetPaintProperty(map, layer.id, "fill-color", darkWaterColor)
          safelySetPaintProperty(map, layer.id, "fill-opacity", 0.9)
        }

        if (
          layer.type === "line" &&
          (layerId.includes("road") || layerId.includes("bridge") || layerId.includes("tunnel"))
        ) {
          const isMajorRoad =
            layerId.includes("motorway") ||
            layerId.includes("trunk") ||
            layerId.includes("primary")

          safelySetPaintProperty(
            map,
            layer.id,
            "line-color",
            isMajorRoad ? darkMajorRoadColor : darkRoadColor
          )
          safelySetPaintProperty(map, layer.id, "line-opacity", isMajorRoad ? 0.92 : 0.76)
        }
      })
    }

    if (map.isStyleLoaded()) {
      applyDarkThemeTweaks()
    }

    map.on("styledata", applyDarkThemeTweaks)

    return () => {
      map.off("styledata", applyDarkThemeTweaks)
    }
  }, [theme])

  useEffect(() => {
    if (isNavigating) {
      const navigationBearing = heading ?? getRouteBearing(routeGeometry) ?? 0

      mapRef.current?.easeTo({
        center: [currentLocation.longitude, currentLocation.latitude],
        zoom: 17.2,
        pitch: 58,
        bearing: navigationBearing,
        duration: 1200,
        easing: cameraEasing,
        essential: true
      })

      return
    }

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
          padding: {
            top: 120,
            right: 84,
            bottom: 156,
            left: 84
          },
          duration: 1700,
          pitch: 14,
          bearing: 0,
          essential: true,
          easing: cameraEasing
        }
      )

      return
    }

    mapRef.current?.easeTo({
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: 14,
      duration: 1200,
      easing: cameraEasing,
      essential: true
    })
  }, [currentLocation, heading, isNavigating, routeGeometry, vehicleType])

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      initialViewState={{
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        zoom: 14
      }}
      onClick={onMapPress}
      style={{ width: "100vw", height: "100vh" }}
      mapStyle={
        theme === "dark"
          ? "mapbox://styles/mapbox/dark-v11"
          : "mapbox://styles/mapbox/streets-v11"
      }
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
            position: "relative",
            width: "30px",
            height: "30px",
            display: "grid",
            placeItems: "center"
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "30px",
              height: "30px",
              borderRadius: "999px",
              background: "rgba(15, 118, 110, 0.18)"
            }}
          />
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "999px",
              background: "#0f766e",
              border: "3px solid #ffffff",
              boxShadow: "0 10px 18px rgba(15, 118, 110, 0.24)"
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "-8px",
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderBottom: "14px solid #0f766e",
              transform: `rotate(${heading ?? getRouteBearing(routeGeometry) ?? 0}deg)`,
              transformOrigin: "center 22px",
              filter: "drop-shadow(0 4px 8px rgba(15, 118, 110, 0.22))"
            }}
          />
        </div>
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
