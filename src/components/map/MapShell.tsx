import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store";
import { dataLoaders } from "@/lib/data";
import type { Region, Prefecture } from '@/types'

export default function MapShell() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mapViewState, setMapViewState } = useAppStore();
  const [currentZoom, setCurrentZoom] = useState(mapViewState.zoom);
  const [hoveredPrefecture, setHoveredPrefecture] = useState<{ name: string; x: number; y: number } | null>(null);

  // Get prefectures data to map codes to slugs for navigation
  const { data: prefectures } = useQuery({
    queryKey: ['prefectures'],
    queryFn: dataLoaders.getPrefectures
  });

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
          tolerance: 0.1, // Reduced tolerance for better accuracy
          buffer: 128, // Increased buffer to prevent clipping
          lineMetrics: false,
          promoteId: "CODE",
          cluster: false, // Disable clustering
          clusterMaxZoom: 14,
          clusterRadius: 50
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
              9,
              0.3, // reduced opacity at zoom 9
              11,
              0.1, // very low opacity at zoom 11
              12,
              0, // completely transparent at zoom 12
              13,
              0, // stay transparent at zoom 13
              14,
              0.1, // start reappearing when zooming back out
              15,
              0.2, // more visible
              16,
              0.3, // visible at high zoom for context
            ],
          },
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
              9,
              0.4, // reduced opacity at zoom 9
              10,
              0.2, // low opacity at zoom 10
              11,
              0.1, // very low opacity at zoom 11
              12,
              0, // completely transparent at zoom 12
              13,
              0, // stay transparent at zoom 13
              14,
              0.2, // start reappearing when zooming back out
              15,
              0.4, // more visible
              16,
              0.6, // visible at high zoom for context
            ],
          },
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
        }, "osm"); // Insert above base map but below prefecture layers

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
              9,
              0.1, // reduced hover opacity at zoom 9
              10,
              0.05, // very low hover opacity at zoom 10
              11,
              0, // no hover effect at zoom 11+
              12,
              0, // stay transparent
              13,
              0, // stay transparent
              14,
              0.05, // subtle hover when zooming back out
              15,
              0.1, // more visible hover
              16,
              0.2, // visible hover at high zoom
            ],
          },
          filter: ["==", "CODE", ""],
        });

        // Add region highlight layer for sidebar hover
        map.current.addLayer({
          id: "japan-region-highlight",
          type: "fill",
          source: "japan-prefectures",
          layout: {
            visibility: "visible",
          },
          paint: {
            "fill-color": "#ff9800", // Orange color for region highlight
            "fill-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              0.3, // region highlight opacity at low zoom
              7,
              0.2, // medium opacity
              9,
              0.1, // reduced opacity at zoom 9
              10,
              0.05, // very low opacity at zoom 10
              11,
              0, // no highlight at zoom 11+
              12,
              0, // stay transparent
              13,
              0, // stay transparent
              14,
              0.05, // subtle highlight when zooming back out
              15,
              0.1, // more visible highlight
              16,
              0.15, // visible highlight at high zoom
            ],
          },
          filter: ["in", "CODE", ""], // Will be updated dynamically
        });

        // Add individual prefecture highlight layer for sidebar hover
        map.current.addLayer({
          id: "japan-prefecture-highlight",
          type: "fill",
          source: "japan-prefectures",
          layout: {
            visibility: "visible",
          },
          paint: {
            "fill-color": "#2196f3", // Blue color for individual prefecture highlight
            "fill-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              0.5, // prefecture highlight opacity at low zoom
              7,
              0.3, // medium opacity
              9,
              0.2, // reduced opacity at zoom 9
              10,
              0.1, // low opacity at zoom 10
              11,
              0, // no highlight at zoom 11+
              12,
              0, // stay transparent
              13,
              0, // stay transparent
              14,
              0.1, // subtle highlight when zooming back out
              15,
              0.2, // more visible highlight
              16,
              0.3, // visible highlight at high zoom
            ],
          },
          filter: ["==", "CODE", ""],
        });

        // Add click and hover interactions (ZOOM DEPENDENT)
        map.current.on("mouseenter", "japan-prefectures-fill", () => {
          if (map.current && map.current.getZoom() < 11) {
            map.current.getCanvas().style.cursor = "pointer";
          }
        });

        map.current.on("mouseleave", "japan-prefectures-fill", () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = "";
            // Use setTimeout to prevent rapid filter changes
            setTimeout(() => {
              if (map.current && map.current.getLayer("japan-prefectures-hover")) {
                map.current.setFilter("japan-prefectures-hover", ["==", "CODE", ""]);
              }
            }, 50);
            setHoveredPrefecture(null);
          }
        });

        let lastHoveredCode = "";
        map.current.on("mousemove", "japan-prefectures-fill", (e) => {
          if (map.current && e.features && e.features.length > 0 && map.current.getZoom() < 11) {
            const feature = e.features[0];
            const currentCode = feature.properties?.CODE;
            
            // Only update filter if the hovered prefecture changed
            if (currentCode && currentCode !== lastHoveredCode) {
              lastHoveredCode = currentCode;
              if (map.current.getLayer("japan-prefectures-hover")) {
                map.current.setFilter("japan-prefectures-hover", ["==", "CODE", currentCode]);
              }
            }

            // Get prefecture name using i18n translations
            const prefectureName = currentCode ? t(`prefectures.${currentCode}`) : "";

            // Set tooltip position and content
            if (prefectureName && e.point) {
              setHoveredPrefecture({
                name: prefectureName,
                x: e.point.x,
                y: e.point.y,
              });
            }
          } else {
            if (lastHoveredCode) {
              lastHoveredCode = "";
              setHoveredPrefecture(null);
            }
          }
        });

        map.current.on("click", "japan-prefectures-fill", (e) => {
          // Prevent any default behavior that might cause page refresh
          e.preventDefault?.();
          e.stopPropagation?.();
          
          if (e.features && e.features.length > 0 && map.current && map.current.getZoom() < 11) {
            const feature = e.features[0];
            const prefectureCode = feature.properties?.CODE;

            console.log("Prefecture clicked!");
            console.log("Prefecture code:", prefectureCode);

            // Use a custom event to handle navigation to avoid refresh
            const navigationEvent = new CustomEvent('navigateToPrefecture', {
              detail: { prefectureCode }
            });
            window.dispatchEvent(navigationEvent);
          } else {
            console.log("Click conditions not met:", {
              hasFeatures: !!(e.features && e.features.length > 0),
              hasMap: !!map.current,
              zoomLevel: map.current?.getZoom(),
              zoomOk: map.current ? map.current.getZoom() < 11 : false
            });
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
        
        // Only ensure layer visibility if needed (less aggressive)
        if (map.current.getLayer("japan-prefectures-fill")) {
          const fillVisibility = map.current.getLayoutProperty("japan-prefectures-fill", "visibility");
          const outlineVisibility = map.current.getLayoutProperty("japan-prefectures-outline", "visibility");
          
          // Only update if visibility is actually wrong
          if (fillVisibility !== "visible") {
            map.current.setLayoutProperty("japan-prefectures-fill", "visibility", "visible");
          }
          if (outlineVisibility !== "visible") {
            map.current.setLayoutProperty("japan-prefectures-outline", "visibility", "visible");
          }
          
          // Only trigger repaint if we actually changed something
          if (fillVisibility !== "visible" || outlineVisibility !== "visible") {
            map.current.triggerRepaint();
          }
        }
      }
    });

    // Update zoom display on zoom events
    map.current.on("zoom", () => {
      if (map.current) {
        const zoom = map.current.getZoom();
        setCurrentZoom(zoom);
        
        // Clear any stuck hover states when zooming
        if (map.current.getLayer("japan-prefectures-hover")) {
          map.current.setFilter("japan-prefectures-hover", ["==", "CODE", ""]);
        }
        if (map.current.getLayer("japan-region-highlight")) {
          map.current.setFilter("japan-region-highlight", ["in", "CODE", ""]);
        }
        if (map.current.getLayer("japan-prefecture-highlight")) {
          map.current.setFilter("japan-prefecture-highlight", ["==", "CODE", ""]);
        }
        setHoveredPrefecture(null);
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

    // Listen for region hover events from sidebar
    const handleRegionHover = (event: CustomEvent) => {
      if (map.current && event.detail && map.current.getLayer("japan-region-highlight")) {
        const { prefectureCodes, isHovering } = event.detail
        
        if (isHovering && prefectureCodes && prefectureCodes.length > 0) {
          // Clear any existing hover states first
          if (map.current.getLayer("japan-prefectures-hover")) {
            map.current.setFilter("japan-prefectures-hover", ["==", "CODE", ""]);
          }
          if (map.current.getLayer("japan-prefecture-highlight")) {
            map.current.setFilter("japan-prefecture-highlight", ["==", "CODE", ""]);
          }
          setHoveredPrefecture(null);
          
          // Highlight all prefectures in the region
          map.current.setFilter("japan-region-highlight", ["in", "CODE", ...prefectureCodes]);
        } else {
          // Clear region highlight
          map.current.setFilter("japan-region-highlight", ["in", "CODE", ""]);
        }
      }
    }

    // Listen for individual prefecture hover events from sidebar
    const handlePrefectureHover = (event: CustomEvent) => {
      if (map.current && event.detail && map.current.getLayer("japan-prefecture-highlight")) {
        const { prefecture } = event.detail
        
        if (prefecture && prefecture.code) {
          // Clear any existing map hover states first
          if (map.current.getLayer("japan-prefectures-hover")) {
            map.current.setFilter("japan-prefectures-hover", ["==", "CODE", ""]);
          }
          setHoveredPrefecture(null);
          
          // Highlight the specific prefecture
          map.current.setFilter("japan-prefecture-highlight", ["==", "CODE", prefecture.code]);
        } else {
          // Clear prefecture highlight
          map.current.setFilter("japan-prefecture-highlight", ["==", "CODE", ""]);
        }
      }
    }

    // Add event listeners for region, prefecture, municipality, and Japan zoom
    window.addEventListener('zoomToRegion', handleRegionZoom as EventListener)
    window.addEventListener('zoomToPrefecture', handlePrefectureZoom as EventListener)
    window.addEventListener('zoomToMunicipality', handleMunicipalityZoom as EventListener)
    window.addEventListener('zoomToJapan', handleZoomToJapan as EventListener)
    
    // Add event listeners for hover effects
    window.addEventListener('hoverRegion', handleRegionHover as EventListener)
    window.addEventListener('hoverPrefecture', handlePrefectureHover as EventListener)

    // Cleanup function
    return () => {
      window.removeEventListener('zoomToRegion', handleRegionZoom as EventListener)
      window.removeEventListener('zoomToPrefecture', handlePrefectureZoom as EventListener)
      window.removeEventListener('zoomToMunicipality', handleMunicipalityZoom as EventListener)
      window.removeEventListener('zoomToJapan', handleZoomToJapan as EventListener)
      window.removeEventListener('hoverRegion', handleRegionHover as EventListener)
      window.removeEventListener('hoverPrefecture', handlePrefectureHover as EventListener)
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

  // Handle prefecture navigation events
  useEffect(() => {
    const handlePrefectureNavigation = (event: CustomEvent) => {
      const { prefectureCode } = event.detail;
      
      if (prefectureCode && prefectures) {
        console.log("Handling navigation for prefecture code:", prefectureCode);
        console.log("Prefectures data available:", !!prefectures);
        console.log("Prefectures count:", prefectures?.length);

        // Find the prefecture data to get the slug for navigation
        const prefecture = prefectures.find((p: Prefecture) => p.code === prefectureCode);
        
        console.log("Found prefecture:", prefecture);
        
        if (prefecture) {
          console.log("Navigating to:", `/prefecture/${prefecture.slug}`);
          
          // Use requestAnimationFrame to ensure smooth navigation
          requestAnimationFrame(() => {
            try {
              // Navigate to the prefecture page without refresh
              navigate(`/prefecture/${prefecture.slug}`, { replace: false });
              
              // Dispatch zoom event after navigation
              setTimeout(() => {
                const prefectureZoomEvent = new CustomEvent('zoomToPrefecture', {
                  detail: { prefecture }
                });
                window.dispatchEvent(prefectureZoomEvent);
              }, 150);
            } catch (error) {
              console.error("Navigation error:", error);
            }
          });
        } else {
          console.log("Prefecture not found in data");
        }
      }
    };

    window.addEventListener('navigateToPrefecture', handlePrefectureNavigation as EventListener);

    return () => {
      window.removeEventListener('navigateToPrefecture', handlePrefectureNavigation as EventListener);
    };
  }, [prefectures, navigate]);

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
