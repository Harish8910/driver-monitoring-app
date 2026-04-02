import type { Coordinates, PlaceSuggestion } from "./mapService"
import type { VehicleType } from "./vehicleConfig"

const SEARCH_HISTORY_KEY = "driver-monitoring.search-history"
const MAX_HISTORY_ITEMS = 8

export type SearchHistoryEntry = {
  coordinates: Coordinates
  fullName: string
  id: string
  name: string
  searchedAt: string
  vehicleType: VehicleType
}

function isCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Coordinates
  return (
    typeof candidate.latitude === "number" &&
    Number.isFinite(candidate.latitude) &&
    typeof candidate.longitude === "number" &&
    Number.isFinite(candidate.longitude)
  )
}

function isSearchHistoryEntry(value: unknown): value is SearchHistoryEntry {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as SearchHistoryEntry
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.fullName === "string" &&
    typeof candidate.searchedAt === "string" &&
    (candidate.vehicleType === "car" ||
      candidate.vehicleType === "bike" ||
      candidate.vehicleType === "walk") &&
    isCoordinates(candidate.coordinates)
  )
}

export function loadSearchHistory() {
  if (typeof window === "undefined") {
    return [] as SearchHistoryEntry[]
  }

  const rawValue = window.localStorage.getItem(SEARCH_HISTORY_KEY)

  if (!rawValue) {
    return [] as SearchHistoryEntry[]
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown

    if (!Array.isArray(parsed)) {
      return [] as SearchHistoryEntry[]
    }

    return parsed.filter(isSearchHistoryEntry).slice(0, MAX_HISTORY_ITEMS)
  } catch {
    return [] as SearchHistoryEntry[]
  }
}

export function saveSearchHistory(entries: SearchHistoryEntry[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(
    SEARCH_HISTORY_KEY,
    JSON.stringify(entries.slice(0, MAX_HISTORY_ITEMS))
  )
}

export function addSearchHistoryEntry(
  entries: SearchHistoryEntry[],
  place: PlaceSuggestion,
  vehicleType: VehicleType
) {
  const nextEntry: SearchHistoryEntry = {
    coordinates: place.coordinates,
    fullName: place.fullName,
    id: place.id,
    name: place.name,
    searchedAt: new Date().toISOString(),
    vehicleType
  }

  const deduplicatedEntries = entries.filter(
    (entry) =>
      entry.id !== nextEntry.id ||
      entry.vehicleType !== nextEntry.vehicleType
  )

  return [nextEntry, ...deduplicatedEntries].slice(0, MAX_HISTORY_ITEMS)
}

