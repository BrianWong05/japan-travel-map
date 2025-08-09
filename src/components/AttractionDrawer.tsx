import { useAppStore } from '@/store'
import { X } from 'lucide-react'
import { Button } from './ui/button'

export default function AttractionDrawer() {
  const { isDrawerOpen, selectedAttraction, setDrawerOpen } = useAppStore()

  if (!isDrawerOpen || !selectedAttraction) {
    return null
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg pointer-events-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Attraction Details</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-gray-600">
          Attraction drawer content for: {selectedAttraction}
        </p>
      </div>
    </div>
  )
}