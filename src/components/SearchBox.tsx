import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { useAppStore } from '@/store'

export default function SearchBox() {
  const { t } = useTranslation()
  const { filters, setFilters } = useAppStore()
  const [localSearch, setLocalSearch] = useState(filters.search)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ search: localSearch })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    // Debounced search - update filters after user stops typing
    setTimeout(() => {
      setFilters({ search: value })
    }, 300)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={localSearch}
        onChange={handleChange}
        placeholder={t('navigation.search')}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </form>
  )
}