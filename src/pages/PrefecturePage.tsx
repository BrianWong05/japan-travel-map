import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { dataLoaders } from '@/lib/data'
import { i18nField } from '@/lib/i18n'
import { useAppStore } from '@/store'
import type { Prefecture, Municipality } from '@/types'

export default function PrefecturePage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentLanguage } = useAppStore()

  // Get all prefectures to find the current one
  const { data: prefectures } = useQuery({
    queryKey: ['prefectures'],
    queryFn: dataLoaders.getPrefectures
  })

  // Get all municipalities
  const { data: municipalities, isLoading, error } = useQuery({
    queryKey: ['municipalities'],
    queryFn: dataLoaders.getMunicipalities
  })

  // Find current prefecture
  const currentPrefecture = prefectures?.find((prefecture: Prefecture) => prefecture.slug === slug)

  // Filter municipalities for this prefecture
  const prefectureMunicipalities = municipalities?.filter((municipality: Municipality) => 
    municipality.prefectureId === currentPrefecture?.id
  )

  const handleMunicipalityClick = (municipality: Municipality, e: React.MouseEvent) => {
    // Don't prevent default - let the Link navigation happen
    // Just dispatch the zoom event for the map
    const municipalityZoomEvent = new CustomEvent('zoomToMunicipality', {
      detail: { municipality }
    })
    window.dispatchEvent(municipalityZoomEvent)
  }

  const handleBackClick = () => {
    // Navigate back to the region page
    if (currentPrefecture) {
      navigate(`/region/${currentPrefecture.regionId}`)
    } else {
      navigate('/')
    }
  }

  if (isLoading) {
    return (
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-6 max-w-sm pointer-events-auto">
        <div className="text-center">{t('common.loading')}</div>
      </div>
    )
  }

  if (error || !currentPrefecture) {
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
          {i18nField(currentPrefecture, 'name', currentLanguage)}
        </h1>
      </div>

      {/* Municipalities list */}
      <div className="space-y-2">
        {prefectureMunicipalities && prefectureMunicipalities.length > 0 ? (
          prefectureMunicipalities.map((municipality) => (
            <Link
              key={municipality.id}
              to={`/municipality/${municipality.slug}`}
              onClick={(e) => handleMunicipalityClick(municipality, e)}
              className="block p-3 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              <div className="font-medium">
                {i18nField(municipality, 'name', currentLanguage)}
              </div>
              <div className="text-sm text-gray-500">
                {municipality.type}
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