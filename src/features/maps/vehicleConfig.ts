export type VehicleType = "car" | "bike" | "walk"

type VehicleOption = {
  label: string
  mapboxProfile: "driving-traffic" | "cycling" | "walking"
  color: string
  icon: string
}

export const VEHICLE_CONFIG: Record<VehicleType, VehicleOption> = {
  car: {
    label: "Car",
    mapboxProfile: "driving-traffic",
    color: "#0f766e",
    icon: "Car"
  },
  bike: {
    label: "Bike",
    mapboxProfile: "cycling",
    color: "#c2410c",
    icon: "Bike"
  },
  walk: {
    label: "Walk",
    mapboxProfile: "walking",
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
