export type VehicleType = "car" | "bike" | "walk"

type VehicleOption = {
  label: string
  mapboxProfile: "driving-traffic" | "walking"
  etaMultiplier: number
  color: string
  icon: string
}

export const VEHICLE_CONFIG: Record<VehicleType, VehicleOption> = {
  car: {
    label: "Car",
    mapboxProfile: "driving-traffic",
    etaMultiplier: 1,
    color: "#0f766e",
    icon: "Car"
  },
  bike: {
    label: "Bike",
    mapboxProfile: "driving-traffic",
    etaMultiplier: 0.9,
    color: "#c2410c",
    icon: "Bike"
  },
  walk: {
    label: "Walk",
    mapboxProfile: "walking",
    etaMultiplier: 1,
    color: "#7c3aed",
    icon: "Walk"
  }
}

export const VEHICLE_OPTIONS = Object.entries(VEHICLE_CONFIG).map(
  ([value, config]) => ({
    value: value as VehicleType,
    ...config
  })
)
