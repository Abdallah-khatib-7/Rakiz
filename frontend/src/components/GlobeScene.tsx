import { useState, useEffect, useRef, useMemo, useImperativeHandle, forwardRef, createContext, useContext, useId, type ReactNode } from 'react'
import MapLibreGL from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { createPortal } from 'react-dom'
import { motion, useScroll, useTransform } from 'framer-motion'

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(' ')
}

type MapContextValue = { map: MapLibreGL.Map | null; isLoaded: boolean }
const MapContext = createContext<MapContextValue | null>(null)
function useMap() {
  const context = useContext(MapContext)
  if (!context) throw new Error('useMap must be used within a Map component')
  return context
}

type MapProps = {
  children?: ReactNode
  className?: string
  center: [number, number]
  zoom: number
  projection?: MapLibreGL.ProjectionSpecification
  style?: string
}

const Map = forwardRef<MapLibreGL.Map, MapProps>(function Map(
  { children, className, center, zoom, projection, style },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<MapLibreGL.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useImperativeHandle(ref, () => mapInstance as MapLibreGL.Map, [mapInstance])

  useEffect(() => {
    if (!containerRef.current) return

    const map = new MapLibreGL.Map({
      container: containerRef.current,
      style: style ?? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center,
      zoom,
        attributionControl: false,
      dragRotate: true,
      scrollZoom: false,
      doubleClickZoom: false,
      touchZoomRotate: true,
    })

    const onLoad = () => {
      setIsLoaded(true)
      if (projection) map.setProjection(projection)
    }
    map.on('load', onLoad)
    setMapInstance(map)

    return () => {
      map.off('load', onLoad)
      map.remove()
      setIsLoaded(false)
      setMapInstance(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const contextValue = useMemo(() => ({ map: mapInstance, isLoaded }), [mapInstance, isLoaded])

  return (
    <MapContext.Provider value={contextValue}>
      <div ref={containerRef} className={cn('relative h-full w-full', className)}>
        {mapInstance && children}
      </div>
    </MapContext.Provider>
  )
})

type MapMarkerProps = {
  longitude: number
  latitude: number
  children: ReactNode
}

function MapMarker({ longitude, latitude, children }: MapMarkerProps) {
  const { map } = useMap()

  const marker = useMemo(() => {
    return new MapLibreGL.Marker({ element: document.createElement('div') }).setLngLat([longitude, latitude])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!map) return
    marker.addTo(map)
    return () => {
      marker.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  return createPortal(<div className="relative">{children}</div>, marker.getElement())
}

type ArcDatum = { id: string; from: [number, number]; to: [number, number] }

function buildArcCoordinates(from: [number, number], to: [number, number], curvature: number, samples: number): [number, number][] {
  const [x0, y0] = from
  const [x2, y2] = to
  const dx = x2 - x0
  const dy = y2 - y0
  const distance = Math.hypot(dx, dy)
  if (distance === 0 || curvature === 0) return [from, to]

  const mx = (x0 + x2) / 2
  const my = (y0 + y2) / 2
  const nx = -dy / distance
  const ny = dx / distance
  const offset = distance * curvature
  const cx = mx + nx * offset
  const cy = my + ny * offset

  const points: [number, number][] = []
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples
    const inv = 1 - t
    const x = inv * inv * x0 + 2 * inv * t * cx + t * t * x2
    const y = inv * inv * y0 + 2 * inv * t * cy + t * t * y2
    points.push([x, y])
  }
  return points
}

function MapArc({ data, color }: { data: ArcDatum[]; color: string }) {
  const { map, isLoaded } = useMap()
  const id = useId()
  const sourceId = `arc-source-${id}`
  const layerId = `arc-layer-${id}`

  useEffect(() => {
    if (!isLoaded || !map) return

    type LineFeature = {
      type: 'Feature'
      properties: Record<string, never>
      geometry: { type: 'LineString'; coordinates: [number, number][] }
    }

    const geoJSON: { type: 'FeatureCollection'; features: LineFeature[] } = {
      type: 'FeatureCollection',
      features: data.map((arc) => ({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: buildArcCoordinates(arc.from, arc.to, 0.15, 64) },
      })),
    }

    map.addSource(sourceId, { type: 'geojson', data: geoJSON })
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': color, 'line-width': 1.5, 'line-opacity': 0.6 },
    })

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map])

  return null
}

const HUB = { name: 'Beirut', lng: 35.5018, lat: 33.8938 }
const DESTINATIONS = [
  { name: 'London', lng: -0.1276, lat: 51.5074 },
  { name: 'New York', lng: -74.006, lat: 40.7128 },
  { name: 'Dubai', lng: 55.2708, lat: 25.2048 },
  { name: 'Riyadh', lng: 46.6753, lat: 24.7136 },
  { name: 'Paris', lng: 2.3522, lat: 48.8566 },
  { name: 'Singapore', lng: 103.8198, lat: 1.3521 },
  { name: 'Tokyo', lng: 139.6917, lat: 35.6895 },
  { name: 'Sydney', lng: 151.2093, lat: -33.8688 },
  { name: 'Toronto', lng: -79.3832, lat: 43.6532 },
  { name: 'Cape Town', lng: 18.4241, lat: -33.9249 },
  { name: 'São Paulo', lng: -46.6333, lat: -23.5505 },
  { name: 'Hong Kong', lng: 114.1694, lat: 22.3193 },
]

const ARCS: ArcDatum[] = DESTINATIONS.map((d) => ({
  id: d.name,
  from: [HUB.lng, HUB.lat],
  to: [d.lng, d.lat],
}))

export default function GlobeScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] })

  const headingOpacity = useTransform(scrollYProgress, [0.15, 0.35], [0, 1])
  const headingY = useTransform(scrollYProgress, [0.15, 0.35], [30, 0])
  const mapOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1])
  const mapScale = useTransform(scrollYProgress, [0.1, 0.4], [0.9, 1])

  return (
    <section ref={containerRef} className="relative bg-[var(--color-void)] py-32 sm:py-40 px-6 sm:px-10 md:px-16 overflow-hidden">
      <motion.div style={{ opacity: headingOpacity, y: headingY }} className="max-w-2xl mb-16">
        <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)] mb-4">From Beirut, to everywhere</p>
        <h2 className="font-bold text-[var(--color-bone)] text-3xl sm:text-5xl md:text-6xl leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
          Distance was never the problem.
        </h2>
      </motion.div>

<motion.div style={{ opacity: mapOpacity, scale: mapScale }} className="relative w-full h-[420px] sm:h-[560px] rounded-2xl overflow-hidden">        <Map center={[HUB.lng, HUB.lat]} zoom={1.4} projection={{ type: 'globe' }}>
          <MapArc data={ARCS} color="#1fb872" />
          <MapMarker longitude={HUB.lng} latitude={HUB.lat}>
            <div className="size-3 rounded-full border-2 border-[var(--color-void)] bg-[var(--color-bullion-bright)] shadow-lg" />
          </MapMarker>
          {DESTINATIONS.map((d) => (
            <MapMarker key={d.name} longitude={d.lng} latitude={d.lat}>
              <div className="size-2 rounded-full border-2 border-[var(--color-void)] bg-[var(--color-emerald-bright)] shadow" />
            </MapMarker>
          ))}
        </Map>
      </motion.div>
    </section>
  )
}