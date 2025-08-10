import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { dataLoaders } from '@/lib/data'
import { i18nField } from '@/lib/i18n'
import { useAppStore } from '@/store'
import type { Region } from '@/types'

export default function HomePage() {
  const { t } = useTranslation()
  const { currentLanguage } = useAppStore()

  const handleRegionClick = (region: Region, e: React.MouseEvent) => {
    e.preventDefault()
    
    // Dispatch a custom event that the map component can listen to
    const regionZoomEvent = new CustomEvent('zoomToRegion', {
      detail: { region }
    })
    window.dispatchEvent(regionZoomEvent)
  }

  const { data: regions, isLoading, error } = useQuery({
    queryKey: ['regions'],
    queryFn: dataLoaders.getRegions
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
            className="block p-3 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors"
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