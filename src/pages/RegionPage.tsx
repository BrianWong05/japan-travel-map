import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { dataLoaders } from '@/lib/data'
import { i18nField } from '@/lib/i18n'
import { useAppStore } from '@/store'
import type { Region, Prefecture } from '@/types'

export default function RegionPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentLanguage } = useAppStore()

  // Get all regions to find the current one
  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: dataLoaders.getRegions
  })

  // Get all prefectures
  const { data: prefectures, isLoading, error } = useQuery({
    queryKey: ['prefectures'],
    queryFn: dataLoaders.getPrefectures
  })

  // Find current region
  const currentRegion = regions?.find((region: Region) => region.slug === slug)

  // Filter prefectures for this region
  const regionPrefectures = prefectures?.filter((prefecture: Prefecture) => 
    prefecture.regionId === currentRegion?.id
  )

  const handlePrefectureClick = (prefecture: Prefecture, e: React.MouseEvent) => {
    // Don't prevent default - let the Link navigation happen
    // Just dispatch the zoom event for the map
    const prefectureZoomEvent = new CustomEvent('zoomToPrefecture', {
      detail: { prefecture }
    })
    window.dispatchEvent(prefectureZoomEvent)
  }

  const handleBackClick = () => {
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-6 max-w-sm pointer-events-auto">
        <div className="text-center">{t('common.loading')}</div>
      </div>
    )
  }

  if (error || !currentRegion) {
    return (
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-6 max-w-sm pointer-events-auto">
        <div className="text-center text-red-600">{t('common.error')}</div>
      </div>
    )
  }

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-6 max-w-sm pointer-events-auto">
      {/* Header with back button */}
      <div className="flex items-center mb-4">
        <button
          onClick={handleBackClick}
          className="mr-3 p-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold">
          {i18nField(currentRegion, 'name', currentLanguage)}
        </h1>
      </div>

      {/* Prefectures list */}
      <div className="space-y-2">
        {regionPrefectures && regionPrefectures.length > 0 ? (
          regionPrefectures.map((prefecture) => (
            <Link
              key={prefecture.id}
              to={`/prefecture/${prefecture.slug}`}
              onClick={(e) => handlePrefectureClick(prefecture, e)}
              className="block p-3 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              <div className="font-medium">
                {i18nField(prefecture, 'name', currentLanguage)}
              </div>
            </Link>
          ))
        ) : (
          <div className="text-gray-500 text-center py-4">
            {t('common.noData')}
          </div>
        )}
      </div>
    </div>
  )
}