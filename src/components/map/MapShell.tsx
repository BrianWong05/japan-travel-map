import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store";
import type { Region } from '@/types'

export default function MapShell() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { t } = useTranslation();
  const { mapViewState, setMapViewState } = useAppStore();
  const [currentZoom, setCurrentZoom] = useState(mapViewState.zoom);
  const [hoveredPrefecture, setHoveredPrefecture] = useState<{ name: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize map only once

    // Initialize MapLibre GL JS map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
            layout: {
              visibility: "visible",
            },
            paint: {
              "raster-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                4,
                0, // completely hidden at low zoom
                7,
                0, // still hidden
                7.5,
                0.2, // start appearing at zoom 7.5
                9,
                0.5, // medium visibility
                10,
                0.7, // more visible at zoom 10
                12,
                0.9, // almost fully visible
                14,
                1.0, // completely visible
                16,
                1.0, // stay completely visible at high zoom
              ],
            },
          },
        ],
      },
      center: [mapViewState.longitude, mapViewState.latitude],
      zoom: mapViewState.zoom,
      maxZoom: 18,
      minZoom: 4,
      maxBounds: [
        [115, 15], // Southwest coordinates (expanded)
        [155, 55], // Northeast coordinates (expanded)
      ],
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    // Load Japan GeoJSON data when map is loaded
    map.current.on("load", async () => {
      if (!map.current) return;

      try {
        // Fetch Japan prefecture GeoJSON data from the geo folder
        const response = await fetch("/geo/jp_prefs/jp_prefs.geojson");
        const japanData = await response.json();

        // Add Japan prefecture source with performance optimizations
        map.current.addSource("japan-prefectures", {
          type: "geojson",
          data: japanData,
          generateId: true,
          tolerance: 0.375,
          buffer: 64,
          lineMetrics: false,
          promoteId: "CODE",
        });

        // Add Japan prefecture fill layer (ZOOM DEPENDENT)
        map.current.addLayer({
          id: "japan-prefectures-fill",
          type: "fill",
          source: "japan-prefectures",
          layout: {
            visibility: "visible",
          },
          paint: {
            "fill-color": [
              "case",
              // Color by prefecture code ranges for different regions
              ["<=", ["to-number", ["get", "CODE"]], 1],
              "#ffecb3", // Hokkaido
              ["<=", ["to-number", ["get", "CODE"]], 7],
              "#e1f5fe", // Tohoku
              ["<=", ["to-number", ["get", "CODE"]], 14],
              "#fff3e0", // Kanto
              ["<=", ["to-number", ["get", "CODE"]], 23],
              "#e8f5e8", // Chubu
              ["<=", ["to-number", ["get", "CODE"]], 30],
              "#fce4ec", // Kansai
              ["<=", ["to-number", ["get", "CODE"]], 35],
              "#f3e5f5", // Chugoku
              ["<=", ["to-number", ["get", "CODE"]], 39],
              "#e0f2f1", // Shikoku
              ["<=", ["to-number", ["get", "CODE"]], 46],
              "#f1f8e9", // Kyushu
              "#fff8e1", // Okinawa
            ],
            "fill-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              0.9, // high opacity at low zoom
              7,
              0.6, // medium opacity
              12,
              0, // completely transparent at zoom 12
              14,
              0, // stay transparent
              16,
              0, // stay transparent at high zoom
            ],
          },
          maxzoom: 16, // Don't render at very high zoom levels
        });

        // Add Japan prefecture outline layer (ZOOM DEPENDENT)
        map.current.addLayer({
          id: "japan-prefectures-outline",
          type: "line",
          source: "japan-prefectures",
          layout: {
            visibility: "visible",
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#1976d2",
            "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.8, 8, 1.2, 10, 1.8, 12, 1.0],
            "line-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              0.9, // high opacity at low zoom
              7,
              0.6, // medium opacity
              10,
              0, // completely transparent at zoom 10
              12,
              0, // stay transparent
              14,
              0, // stay transparent
              16,
              0, // stay transparent at high zoom
            ],
          },
          maxzoom: 16, // Don't render at very high zoom levels
        });

        // Create a mask to hide everything outside Japan
        // Extract all Japan polygon coordinates to create proper holes
        const japanHoles = [];
        japanData.features.forEach((feature) => {
          if (feature.geometry.type === "MultiPolygon") {
            feature.geometry.coordinates.forEach((polygon) => {
              japanHoles.push(polygon[0]); // Take the outer ring of each polygon
            });
          } else if (feature.geometry.type === "Polygon") {
            japanHoles.push(feature.geometry.coordinates[0]); // Take the outer ring
          }
        });

        // Create world polygon with Japan boundaries as holes
        const worldWithJapanHoles = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [
                  // Outer ring (larger area around Japan)
                  [
                    [115, 15], // Southwest
                    [155, 15], // Southeast
                    [155, 55], // Northeast
                    [115, 55], // Northwest
                    [115, 15], // Close the ring
                  ],
                  // Add Japan holes (reversed winding for holes)
                  ...japanHoles.map((hole) => hole.slice().reverse()),
                ],
              },
            },
          ],
        };

        // Add world mask source
        map.current.addSource("world-mask", {
          type: "geojson",
          data: worldWithJapanHoles,
        });

        // Add mask layer that covers everything outside Japan
        map.current.addLayer({
          id: "world-mask",
          type: "fill",
          source: "world-mask",
          paint: {
            "fill-color": "#b3d9ff",
            "fill-opacity": 0.0,
          },
        }); // Insert above base map

        // Add hover effect (ZOOM DEPENDENT)
        map.current.addLayer({
          id: "japan-prefectures-hover",
          type: "fill",
          source: "japan-prefectures",
          layout: {
            visibility: "visible",
          },
          paint: {
            "fill-color": "#1976d2",
            "fill-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              0.4, // hover opacity at low zoom
              7,
              0.2, // medium hover opacity
              10,
              0, // no hover effect at zoom 10
              12,
              0, // stay transparent
              14,
              0, // stay transparent
              16,
              0, // stay transparent at high zoom
            ],
          },
          filter: ["==", "CODE", ""],
          maxzoom: 14, // Don't render hover at very high zoom levels
        });

        // Add click and hover interactions (ZOOM DEPENDENT)
        map.current.on("mouseenter", "japan-prefectures-fill", () => {
          if (map.current && map.current.getZoom() < 10) {
            map.current.getCanvas().style.cursor = "pointer";
          }
        });

        map.current.on("mouseleave", "japan-prefectures-fill", () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = "";
            map.current.setFilter("japan-prefectures-hover", ["==", "CODE", ""]);
            setHoveredPrefecture(null);
          }
        });

        map.current.on("mousemove", "japan-prefectures-fill", (e) => {
          if (map.current && e.features && e.features.length > 0 && map.current.getZoom() < 10) {
            const feature = e.features[0];
            map.current.setFilter("japan-prefectures-hover", ["==", "CODE", feature.properties?.CODE]);

            // Get prefecture name using i18n translations
            const prefectureCode = feature.properties?.CODE;
            const prefectureName = prefectureCode ? t(`prefectures.${prefectureCode}`) : "";

            // Set tooltip position and content
            if (prefectureName && e.point) {
              setHoveredPrefecture({
                name: prefectureName,
                x: e.point.x,
                y: e.point.y,
              });
            }
          } else {
            setHoveredPrefecture(null);
          }
        });

        map.current.on("click", "japan-prefectures-fill", (e) => {
          if (e.features && e.features.length > 0 && map.current && map.current.getZoom() < 10) {
            const feature = e.features[0];
            const prefectureCode = feature.properties?.CODE;
            const prefectureName = prefectureCode ? t(`prefectures.${prefectureCode}`) : "";

            console.log("Clicked prefecture:", prefectureName, `(${feature.properties?.NAME})`);

            // Calculate the bounds of the clicked prefecture
            if (feature.geometry) {
              try {
                // Get the bounds of the feature geometry
                const bounds = new maplibregl.LngLatBounds();

                const addCoordinatesToBounds = (coords: any) => {
                  if (Array.isArray(coords[0])) {
                    coords.forEach((coord: any) => addCoordinatesToBounds(coord));
                  } else {
                    bounds.extend([coords[0], coords[1]]);
                  }
                };

                if (feature.geometry.type === "MultiPolygon") {
                  feature.geometry.coordinates.forEach((polygon: any) => {
                    polygon.forEach((ring: any) => {
                      ring.forEach((coord: any) => bounds.extend([coord[0], coord[1]]));
                    });
                  });
                } else if (feature.geometry.type === "Polygon") {
                  feature.geometry.coordinates.forEach((ring: any) => {
                    ring.forEach((coord: any) => bounds.extend([coord[0], coord[1]]));
                  });
                }

                // Fit the map to the prefecture bounds with padding
                map.current.fitBounds(bounds, {
                  padding: 50,
                  duration: 1000,
                  maxZoom: 9,
                });
              } catch (error) {
                console.error("Error calculating prefecture bounds:", error);
              }
            }
          }
        });

        console.log("Japan prefectures loaded successfully");
      } catch (error) {
        console.error("Error loading Japan prefectures:", error);
      }
    });

    // Update store when map view changes
    map.current.on("moveend", () => {
      if (map.current) {
        const center = map.current.getCenter();
        const zoom = map.current.getZoom();
        setCurrentZoom(zoom);
        setMapViewState({
          latitude: center.lat,
          longitude: center.lng,
          zoom: zoom,
        });
      }
    });

    // Update zoom display on zoom events
    map.current.on("zoom", () => {
      if (map.current) {
        const zoom = map.current.getZoom();
        setCurrentZoom(zoom);
      }
    });

    // Listen for region zoom events
    const handleRegionZoom = (event: CustomEvent) => {
      if (map.current && event.detail?.region) {
        const region = event.detail.region as Region
        
        // Calculate center and zoom from bbox
        const [minLng, minLat, maxLng, maxLat] = region.bbox
        const centerLng = (minLng + maxLng) / 2
        const centerLat = (minLat + maxLat) / 2
        
        // Calculate appropriate zoom level based on bbox size
        const lngDiff = maxLng - minLng
        const latDiff = maxLat - minLat
        const maxDiff = Math.max(lngDiff, latDiff)
        
        // Estimate zoom level
        let zoom = 7
        if (maxDiff < 2) zoom = 8
        if (maxDiff < 1.5) zoom = 9
        if (maxDiff < 1) zoom = 10
        if (maxDiff > 4) zoom = 6
        if (maxDiff > 6) zoom = 5
        
        // Use fitBounds for more accurate framing
        const bounds = new maplibregl.LngLatBounds([minLng, minLat], [maxLng, maxLat])
        map.current.fitBounds(bounds, {
          padding: 50,
          duration: 1500,
          maxZoom: zoom
        })
      }
    }

    // Listen for prefecture zoom events
    const handlePrefectureZoom = (event: CustomEvent) => {
      if (map.current && event.detail?.prefecture) {
        const prefecture = event.detail.prefecture
        
        // Calculate center and zoom from bbox
        const [minLng, minLat, maxLng, maxLat] = prefecture.bbox
        
        // Use fitBounds for more accurate framing
        const bounds = new maplibregl.LngLatBounds([minLng, minLat], [maxLng, maxLat])
        map.current.fitBounds(bounds, {
          padding: 50,
          duration: 1500,
          maxZoom: 10
        })
      }
    }

    // Listen for municipality zoom events
    const handleMunicipalityZoom = (event: CustomEvent) => {
      if (map.current && event.detail?.municipality) {
        const municipality = event.detail.municipality
        
        // Calculate center and zoom from bbox
        const [minLng, minLat, maxLng, maxLat] = municipality.bbox
        
        // Use fitBounds for more accurate framing
        const bounds = new maplibregl.LngLatBounds([minLng, minLat], [maxLng, maxLat])
        map.current.fitBounds(bounds, {
          padding: 50,
          duration: 1500,
          maxZoom: 12
        })
      }
    }

    // Listen for zoom to Japan events (back to overview)
    const handleZoomToJapan = () => {
      if (map.current) {
        // Zoom back to the center of Japan (default initial position)
        map.current.flyTo({
          center: [138.2529, 36.2048], // Center of Japan
          zoom: 5,
          duration: 1500
        })
      }
    }

    // Add event listeners for region, prefecture, municipality, and Japan zoom
    window.addEventListener('zoomToRegion', handleRegionZoom as EventListener)
    window.addEventListener('zoomToPrefecture', handlePrefectureZoom as EventListener)
    window.addEventListener('zoomToMunicipality', handleMunicipalityZoom as EventListener)
    window.addEventListener('zoomToJapan', handleZoomToJapan as EventListener)

    // Cleanup function
    return () => {
      window.removeEventListener('zoomToRegion', handleRegionZoom as EventListener)
      window.removeEventListener('zoomToPrefecture', handlePrefectureZoom as EventListener)
      window.removeEventListener('zoomToMunicipality', handleMunicipalityZoom as EventListener)
      window.removeEventListener('zoomToJapan', handleZoomToJapan as EventListener)
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update map view when store state changes (e.g., from external navigation)
  useEffect(() => {
    if (map.current) {
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();

      // Only update if there's a significant difference to avoid infinite loops
      const latDiff = Math.abs(currentCenter.lat - mapViewState.latitude);
      const lngDiff = Math.abs(currentCenter.lng - mapViewState.longitude);
      const zoomDiff = Math.abs(currentZoom - mapViewState.zoom);

      if (latDiff > 0.001 || lngDiff > 0.001 || zoomDiff > 0.1) {
        map.current.flyTo({
          center: [mapViewState.longitude, mapViewState.latitude],
          zoom: mapViewState.zoom,
          duration: 1000,
        });
      }
    }
  }, [mapViewState]);

  return (
    <>
      <div ref={mapContainer} className="absolute inset-0" style={{ width: "100%", height: "100%" }} />
      {/* Zoom Level Display */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 pointer-events-none">
        <div className="text-sm font-medium text-gray-700">Zoom: {currentZoom.toFixed(1)}</div>
      </div>
      {/* Prefecture Hover Tooltip */}
      {hoveredPrefecture && (
        <div
          className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10 text-sm font-medium"
          style={{
            left: hoveredPrefecture.x + 10,
            top: hoveredPrefecture.y - 10,
            transform: "translateY(-100%)",
          }}
        >
          {hoveredPrefecture.name}
        </div>
      )}
    </>
  );
}
