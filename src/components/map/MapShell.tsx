import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store'

export default function MapShell() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const { mapViewState } = useAppStore()

  useEffect(() => {
    if (map.current) return // Initialize map only once

    // TODO: Initialize MapLibre GL JS map
    // For now, show a placeholder
    console.log('Map would be initialized here with MapLibre GL JS')
    
  }, [])

  return (
    <div 
      ref={mapContainer} 
      className="absolute inset-0 bg-gray-100 flex items-center justify-center"
    >
      <div className="text-center text-gray-500">
        <div className="text-lg font-semibold mb-2">Interactive Map</div>
        <div className="text-sm">MapLibre GL JS integration coming soon</div>
        <div className="text-xs mt-2">
          Current view: {mapViewState.latitude.toFixed(4)}, {mapViewState.longitude.toFixed(4)} 
          (zoom: {mapViewState.zoom})
        </div>
      </div>
    </div>
  )
}