import { useEffect, useRef, useState } from "react"

export type GeolocationState = {
  accuracy: number | null
  heading: number | null
  lat: number
  lng: number
  speed: number | null
}

function getBearingBetweenPoints(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number
) {
  const startLatitudeRadians = (startLatitude * Math.PI) / 180
  const endLatitudeRadians = (endLatitude * Math.PI) / 180
  const longitudeDeltaRadians = ((endLongitude - startLongitude) * Math.PI) / 180

  const y = Math.sin(longitudeDeltaRadians) * Math.cos(endLatitudeRadians)
  const x =
    Math.cos(startLatitudeRadians) * Math.sin(endLatitudeRadians) -
    Math.sin(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.cos(longitudeDeltaRadians)

  const bearing = (Math.atan2(y, x) * 180) / Math.PI
  return (bearing + 360) % 360
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationState | null>(null)
  const lastPositionRef = useRef<GeolocationCoordinates | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      return
    }

    const handlePosition = (position: GeolocationPosition) => {
      const previousCoordinates = lastPositionRef.current
      const distanceMoved =
        previousCoordinates
          ? Math.hypot(
              position.coords.latitude - previousCoordinates.latitude,
              position.coords.longitude - previousCoordinates.longitude
            )
          : 0
      const derivedHeading =
        previousCoordinates && distanceMoved > 0.00003
          ? getBearingBetweenPoints(
              previousCoordinates.latitude,
              previousCoordinates.longitude,
              position.coords.latitude,
              position.coords.longitude
            )
          : null

      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        heading: position.coords.heading ?? derivedHeading,
        speed: position.coords.speed ?? null
      })
      lastPositionRef.current = position.coords
    }

    navigator.geolocation.getCurrentPosition(handlePosition, (error) => {
      console.error(error)
    })

    const watchId = navigator.geolocation.watchPosition(handlePosition, (error) => {
      console.error(error)
    }, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 15000
    })

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return location
}
