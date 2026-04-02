import type { Coordinates } from "./mapService"
import { VEHICLE_CONFIG, type VehicleType } from "./vehicleConfig"

export type LineStringGeometry = {
  type: "LineString"
  coordinates: [number, number][]
}

export type RouteStep = {
  distanceMeters: number
  instruction: string
  location: Coordinates
  modifier: string | null
  name: string
  type: string
}

export type RouteDetails = {
  distanceMeters: number
  durationSeconds: number
  geometry: LineStringGeometry
  profileLabel: string
  steps: RouteStep[]
}

export type NavigationGuidance = {
  distanceMeters: number
  distanceLabel: string
  instruction: string
  secondaryText: string | null
  stepKey: string
  voiceText: string
}

type MapboxManeuver = {
  instruction?: string
  location: [number, number]
  modifier?: string
  type?: string
}

type MapboxStep = {
  distance: number
  duration: number
  maneuver: MapboxManeuver
  name?: string
}

type MapboxLeg = {
  steps?: MapboxStep[]
}

type MapboxRoute = {
  distance: number
  duration: number
  geometry: LineStringGeometry
  legs?: MapboxLeg[]
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
  const { etaMultiplier, label, mapboxProfile } = VEHICLE_CONFIG[vehicleType]
  const coordinates = [
    `${origin.longitude},${origin.latitude}`,
    `${destination.longitude},${destination.latitude}`
  ].join(";")

  const url = new URL(`${MAPBOX_DIRECTIONS_URL}/${mapboxProfile}/${coordinates}`)
  url.searchParams.set("access_token", getMapboxToken())
  url.searchParams.set("alternatives", "true")
  url.searchParams.set("geometries", "geojson")
  url.searchParams.set("overview", "full")
  url.searchParams.set("steps", "true")

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
  const steps = (bestRoute.legs ?? [])
    .flatMap((leg) => leg.steps ?? [])
    .map((step) => ({
      distanceMeters: step.distance,
      instruction: step.maneuver.instruction ?? "Continue straight",
      location: {
        longitude: step.maneuver.location[0],
        latitude: step.maneuver.location[1]
      },
      modifier: step.maneuver.modifier ?? null,
      name: step.name ?? "",
      type: step.maneuver.type ?? "continue"
    }))

  return {
    distanceMeters: bestRoute.distance,
    durationSeconds: bestRoute.duration * etaMultiplier,
    geometry: bestRoute.geometry,
    profileLabel: label,
    steps
  }
}

export function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`
}

export function getDistanceBetweenCoordinates(
  start: Coordinates,
  end: Coordinates
) {
  const earthRadiusMeters = 6371000
  const startLatitude = (start.latitude * Math.PI) / 180
  const endLatitude = (end.latitude * Math.PI) / 180
  const deltaLatitude = ((end.latitude - start.latitude) * Math.PI) / 180
  const deltaLongitude = ((end.longitude - start.longitude) * Math.PI) / 180

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusMeters * c
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

function formatInstructionDistance(distanceMeters: number) {
  if (distanceMeters <= 20) {
    return "Now"
  }

  if (distanceMeters < 1000) {
    return `In ${Math.round(distanceMeters)} m`
  }

  return `In ${(distanceMeters / 1000).toFixed(1)} km`
}

function lowerCaseFirstLetter(value: string) {
  if (!value) {
    return value
  }

  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`
}

export function getNextNavigationGuidance(
  route: RouteDetails
): NavigationGuidance | null {
  const upcomingStep =
    route.steps.find(
      (step) => step.type !== "arrive" && (step.distanceMeters > 15 || route.steps.length === 1)
    ) ??
    route.steps.find((step) => step.type !== "arrive") ??
    route.steps[0]

  if (!upcomingStep) {
    return null
  }

  const distanceLabel = formatInstructionDistance(upcomingStep.distanceMeters)
  const voiceText =
    upcomingStep.distanceMeters <= 20
      ? upcomingStep.instruction
      : `${distanceLabel}, ${lowerCaseFirstLetter(upcomingStep.instruction)}`

  return {
    distanceMeters: upcomingStep.distanceMeters,
    distanceLabel,
    instruction: upcomingStep.instruction,
    secondaryText: upcomingStep.name ? `via ${upcomingStep.name}` : null,
    stepKey: `${upcomingStep.type}:${upcomingStep.modifier ?? ""}:${upcomingStep.name}:${upcomingStep.instruction}`,
    voiceText
  }
}
