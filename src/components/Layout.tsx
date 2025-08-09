import type { ReactNode } from 'react'
import Header from './Header'
import MapShell from './map/MapShell'
import AttractionDrawer from './AttractionDrawer'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative">
        <MapShell />
        <div className="absolute inset-0 pointer-events-none">
          {children}
        </div>
        <AttractionDrawer />
      </div>
    </div>
  )
}