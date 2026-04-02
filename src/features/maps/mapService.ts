export type Coordinates = {
  latitude: number
  longitude: number
}

export type PlaceSuggestion = {
  id: string
  name: string
  fullName: string
  coordinates: Coordinates
}

type MapboxFeature = {
  id: string
  text: string
  place_name: string
  center: [number, number]
}

type GeocodingResponse = {
  features: MapboxFeature[]
}

const MAPBOX_GEOCODING_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places"

const getMapboxToken = () => {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

  if (!token) {
    throw new Error("Mapbox token is missing. Add VITE_MAPBOX_TOKEN to your environment.")
  }

  return token
}

export async function searchPlaces(
  query: string,
  proximity?: Coordinates,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> {
  const trimmedQuery = query.trim()

  if (trimmedQuery.length < 2) {
    return []
  }

  const url = new URL(
    `${MAPBOX_GEOCODING_URL}/${encodeURIComponent(trimmedQuery)}.json`
  )

  url.searchParams.set("access_token", getMapboxToken())
  url.searchParams.set("autocomplete", "true")
  url.searchParams.set("limit", "5")
  url.searchParams.set("language", "en")

  if (proximity) {
    url.searchParams.set(
      "proximity",
      `${proximity.longitude},${proximity.latitude}`
    )
  }

  const response = await fetch(url.toString(), { signal })

  if (!response.ok) {
    throw new Error("We couldn't load place suggestions right now.")
  }

  const data = (await response.json()) as GeocodingResponse

  return data.features.map((feature) => ({
    id: feature.id,
    name: feature.text,
    fullName: feature.place_name,
    coordinates: {
      longitude: feature.center[0],
      latitude: feature.center[1]
    }
  }))
}
