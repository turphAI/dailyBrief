import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface AppShellProps {
  activeView: 'testing' | 'guide'
  onViewChange: (view: 'testing' | 'guide') => void
  children: ReactNode
}

export default function AppShell({ activeView, onViewChange, children }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* Main container with sidebar and content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeView={activeView} onViewChange={onViewChange} />

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
