import { useParams } from 'react-router-dom'

export default function MunicipalityPage() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-6 max-w-sm pointer-events-auto">
      <h1 className="text-xl font-bold mb-4">Municipality: {slug}</h1>
      <p className="text-gray-600">Attraction list will be implemented here</p>
    </div>
  )
}