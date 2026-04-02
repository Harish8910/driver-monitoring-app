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

const MERGED_PLACE_TERMS = [
  [/railwaystation/gi, "Railway Station"],
  [/metrostation/gi, "Metro Station"],
  [/trainstation/gi, "Train Station"],
  [/busstand/gi, "Bus Stand"],
  [/policestation/gi, "Police Station"],
  [/postoffice/gi, "Post Office"]
] as const

const getMapboxToken = () => {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

  if (!token) {
    throw new Error("Mapbox token is missing. Add VITE_MAPBOX_TOKEN to your environment.")
  }

  return token
}

function formatPlaceLabel(value: string) {
  const withExpandedTerms = MERGED_PLACE_TERMS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    value
  )

  return withExpandedTerms
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeSearchValue(value: string) {
  return formatPlaceLabel(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function getWords(value: string) {
  return formatPlaceLabel(value).match(/[A-Za-z0-9]+/g) ?? []
}

function getNormalizedWords(value: string) {
  return getWords(value).map((word) => normalizeSearchValue(word))
}

function toDisplayCase(value: string) {
  return formatPlaceLabel(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const [first = "", ...rest] = word
      return `${first.toUpperCase()}${rest.join("").toLowerCase()}`
    })
    .join(" ")
}

function buildQueryFirstLabel(feature: MapboxFeature, query: string) {
  const queryWords = getNormalizedWords(query)

  if (queryWords.length < 2) {
    return null
  }

  const candidateWords = [...getWords(feature.place_name), ...getWords(feature.text)]
  const candidateWordMap = new Map<string, string>()

  for (const candidateWord of candidateWords) {
    const normalizedCandidateWord = normalizeSearchValue(candidateWord)

    if (normalizedCandidateWord && !candidateWordMap.has(normalizedCandidateWord)) {
      candidateWordMap.set(normalizedCandidateWord, candidateWord)
    }
  }

  const matchedWords: string[] = []

  for (const queryWord of queryWords) {
    const directMatch = candidateWordMap.get(queryWord)

    if (directMatch) {
      matchedWords.push(directMatch)
      continue
    }

    const prefixMatch = [...candidateWordMap.entries()].find(([candidateWord]) =>
      candidateWord.startsWith(queryWord) || queryWord.startsWith(candidateWord)
    )

    if (!prefixMatch) {
      return null
    }

    matchedWords.push(prefixMatch[1])
  }

  return formatPlaceLabel(matchedWords.join(" "))
}

function getBestPlaceName(feature: MapboxFeature, query: string) {
  const formattedText = formatPlaceLabel(feature.text)
  const formattedPlaceName = formatPlaceLabel(feature.place_name)
  const segments = formattedPlaceName
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean)
  const normalizedQuery = normalizeSearchValue(query)
  const queryFirstLabel = buildQueryFirstLabel(feature, query)

  if (queryFirstLabel) {
    return queryFirstLabel
  }

  if (normalizedQuery) {
    const matchingSegment = segments.find((segment) =>
      normalizeSearchValue(segment).includes(normalizedQuery)
    )

    if (matchingSegment) {
      return matchingSegment
    }

    if (normalizeSearchValue(formattedPlaceName).includes(normalizedQuery)) {
      return segments[0] ?? formattedPlaceName
    }

    if (normalizeSearchValue(formattedText).includes(normalizedQuery)) {
      return formattedText
    }
  }

  return segments[0] ?? formattedText ?? toDisplayCase(query)
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
    name: getBestPlaceName(feature, trimmedQuery),
    fullName: formatPlaceLabel(feature.place_name),
    coordinates: {
      longitude: feature.center[0],
      latitude: feature.center[1]
    }
  }))
}
