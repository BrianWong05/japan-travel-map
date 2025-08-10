import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { dataLoaders } from '@/lib/data'
import { i18nField } from '@/lib/i18n'
import { useAppStore } from '@/store'
import type { Region, Prefecture } from '@/types'

export default function HomePage() {
  const { t } = useTranslation()
  const { currentLanguage } = useAppStore()

  const handleRegionClick = (region: Region, e: React.MouseEvent) => {
    // Don't prevent default - let the Link navigation happen
    // Just dispatch the zoom event for the map
    const regionZoomEvent = new CustomEvent('zoomToRegion', {
      detail: { region }
    })
    window.dispatchEvent(regionZoomEvent)
  }

  const handleRegionHover = (region: Region | null) => {
    if (region && prefectures) {
      // Get all prefecture codes for this region
      const regionPrefectures = prefectures.filter((prefecture: Prefecture) => 
        prefecture.regionId === region.id
      )
      const prefectureCodes = regionPrefectures.map(p => p.code)
      
      // Dispatch hover event for the map
      const regionHoverEvent = new CustomEvent('hoverRegion', {
        detail: { 
          region, 
          prefectureCodes,
          isHovering: true 
        }
      })
      window.dispatchEvent(regionHoverEvent)
    } else {
      // Clear hover
      const regionHoverEvent = new CustomEvent('hoverRegion', {
        detail: { 
          region: null, 
          prefectureCodes: [],
          isHovering: false 
        }
      })
      window.dispatchEvent(regionHoverEvent)
    }
  }

  const { data: regions, isLoading, error } = useQuery({
    queryKey: ['regions'],
    queryFn: dataLoaders.getRegions
  })

  // Get all prefectures to map regions to prefecture codes
  const { data: prefectures } = useQuery({
    queryKey: ['prefectures'],
    queryFn: dataLoaders.getPrefectures
  })

  if (isLoading) {
    return (
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-6 max-w-sm">
        <div className="text-center">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-6 max-w-sm">
        <div className="text-center text-red-600">{t('common.error')}</div>
      </div>
    )
  }

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-6 max-w-sm pointer-events-auto">
      <h1 className="text-xl font-bold mb-4">{t('navigation.regions')}</h1>
      <div className="space-y-2">
        {regions?.map((region) => (
          <Link
            key={region.id}
            to={`/region/${region.slug}`}
            onClick={(e) => handleRegionClick(region, e)}
            onMouseEnter={() => handleRegionHover(region)}
            onMouseLeave={() => handleRegionHover(null)}
            className="block p-3 rounded-md hover:bg-orange-50 border border-gray-200 transition-colors hover:border-orange-300"
          >
            <div className="font-medium">
              {i18nField(region, 'name', currentLanguage)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}