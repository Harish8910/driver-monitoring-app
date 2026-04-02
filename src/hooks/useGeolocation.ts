import { useEffect, useState } from "react"

export const useGeolocation = () => {
  const [location, setLocation] = useState<any>(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        })
      },
      (err) => {
        console.error(err)
      }
    )
  }, [])

  return location
}