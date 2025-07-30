'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import DailyTasksSidebar from './DailyTasksSidebar'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Percorsi dove non mostrare la navbar e la sidebar
  const publicPaths = ['/login']
  const showNavbar = !publicPaths.includes(pathname)
  
  // Mostra la sidebar solo nella home page
  const showSidebar = showNavbar && pathname === '/'

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className={`transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {showNavbar && (
        <div className="sticky top-0 z-50">
          <Navbar />
        </div>
      )}
      <main className={showNavbar ? 'min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50' : ''}>
        <div className={`transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {children}
        </div>
        {showSidebar && <DailyTasksSidebar />}
      </main>
    </div>
  )
}