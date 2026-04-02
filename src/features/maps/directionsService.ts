import type { Coordinates } from "./mapService"
import { VEHICLE_CONFIG, type VehicleType } from "./vehicleConfig"

export type LineStringGeometry = {
  type: "LineString"
  coordinates: [number, number][]
}

export type RouteDetails = {
  distanceMeters: number
  durationSeconds: number
  geometry: LineStringGeometry
  profileLabel: string
}

type MapboxRoute = {
  distance: number
  duration: number
  geometry: LineStringGeometry
}

type DirectionsResponse = {
  routes: MapboxRoute[]
}

const MAPBOX_DIRECTIONS_URL = "https://api.mapbox.com/directions/v5/mapbox"

const getMapboxToken = () => {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

  if (!token) {
    throw new Error("Mapbox token is missing. Add VITE_MAPBOX_TOKEN to your environment.")
  }

  return token
}

export async function getBestRoute(
  origin: Coordinates,
  destination: Coordinates,
  vehicleType: VehicleType,
  signal?: AbortSignal
): Promise<RouteDetails> {
  const { mapboxProfile, label } = VEHICLE_CONFIG[vehicleType]
  const coordinates = [
    `${origin.longitude},${origin.latitude}`,
    `${destination.longitude},${destination.latitude}`
  ].join(";")

  const url = new URL(`${MAPBOX_DIRECTIONS_URL}/${mapboxProfile}/${coordinates}`)
  url.searchParams.set("access_token", getMapboxToken())
  url.searchParams.set("alternatives", "true")
  url.searchParams.set("geometries", "geojson")
  url.searchParams.set("overview", "full")
  url.searchParams.set("steps", "false")

  const response = await fetch(url.toString(), { signal })

  if (!response.ok) {
    throw new Error("We couldn't calculate a route for that destination.")
  }

  const data = (await response.json()) as DirectionsResponse

  if (!data.routes.length) {
    throw new Error("No route is available for the selected destination.")
  }

  const bestRoute = data.routes.reduce((fastestRoute, route) =>
    route.duration < fastestRoute.duration ? route : fastestRoute
  )

  return {
    distanceMeters: bestRoute.distance,
    durationSeconds: bestRoute.duration,
    geometry: bestRoute.geometry,
    profileLabel: label
  }
}

export function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`
}

export function formatDuration(durationSeconds: number) {
  const roundedMinutes = Math.max(1, Math.round(durationSeconds / 60))
  const hours = Math.floor(roundedMinutes / 60)
  const minutes = roundedMinutes % 60

  if (!hours) {
    return `${roundedMinutes} min`
  }

  if (!minutes) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
}
