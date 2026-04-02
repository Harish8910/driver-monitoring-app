import { Layer, Source, type LayerProps } from "react-map-gl/mapbox"
import type { LineStringGeometry } from "../../features/maps/directionsService"

type RouteLayerProps = {
  color: string
  geometry: LineStringGeometry
}

const routeOutlineStyle: LayerProps = {
  id: "route-outline",
  type: "line",
  paint: {
    "line-color": "#ffffff",
    "line-width": 10,
    "line-opacity": 0.9
  },
  layout: {
    "line-cap": "round",
    "line-join": "round"
  }
}

const routeLineStyle = (color: string): LayerProps => ({
  id: "route-line",
  type: "line",
  paint: {
    "line-color": color,
    "line-width": 6
  },
  layout: {
    "line-cap": "round",
    "line-join": "round"
  }
})

function RouteLayer({ color, geometry }: RouteLayerProps) {
  return (
    <Source
      id="route-source"
      type="geojson"
      data={{
        type: "Feature",
        properties: {},
        geometry
      }}
    >
      <Layer {...routeOutlineStyle} />
      <Layer {...routeLineStyle(color)} />
    </Source>
  )
}

export default RouteLayer
