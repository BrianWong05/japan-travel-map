import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { getI18nLanguage } from '@/lib/i18n'
import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import RegionPage from '@/pages/RegionPage'
import PrefecturePage from '@/pages/PrefecturePage'
import MunicipalityPage from '@/pages/MunicipalityPage'
import AttractionPage from '@/pages/AttractionPage'

function App() {
  const { i18n } = useTranslation()
  const currentLanguage = useAppStore((state) => state.currentLanguage)

  // Sync language with i18next
  useEffect(() => {
    const i18nLang = getI18nLanguage(currentLanguage)
    if (i18n.language !== i18nLang) {
      i18n.changeLanguage(i18nLang)
    }
  }, [currentLanguage, i18n])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/region/:slug" element={<RegionPage />} />
        <Route path="/prefecture/:slug" element={<PrefecturePage />} />
        <Route path="/municipality/:slug" element={<MunicipalityPage />} />
        <Route path="/attraction/:slug" element={<AttractionPage />} />
      </Routes>
    </Layout>
  )
}

export default App
