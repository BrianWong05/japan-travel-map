import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Heart } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import SearchBox from './SearchBox'
import { Button } from './ui/button'

export default function Header() {
  const { t } = useTranslation()

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-gray-900">
          <MapPin className="h-6 w-6 text-blue-600" />
          <span>Japan Travel Map</span>
        </Link>
      </div>

      <div className="flex-1 max-w-md mx-4">
        <SearchBox />
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm">
          <Heart className="h-4 w-4 mr-2" />
          {t('navigation.favorites')}
        </Button>
        <LanguageSwitcher />
      </div>
    </header>
  )
}