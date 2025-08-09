import { useParams } from 'react-router-dom'

export default function RegionPage() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-6 max-w-sm pointer-events-auto">
      <h1 className="text-xl font-bold mb-4">Region: {slug}</h1>
      <p className="text-gray-600">Prefecture list will be implemented here</p>
    </div>
  )
}