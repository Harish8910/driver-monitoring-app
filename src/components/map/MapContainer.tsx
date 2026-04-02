import Map, { Marker } from 'react-map-gl/mapbox';
import "mapbox-gl/dist/mapbox-gl.css"

function MapContainer({ latitude, longitude }: any) {
  return (
    <Map
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      initialViewState={{
        latitude,
        longitude,
        zoom: 14
      }}
      style={{ width: "100%", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
    >
      <Marker latitude={latitude} longitude={longitude} />
    </Map>
  )
}

export default MapContainer