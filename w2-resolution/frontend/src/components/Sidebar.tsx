import { Beaker, BookOpen } from 'lucide-react'

interface SidebarProps {
  activeView: 'testing' | 'guide'
  onViewChange: (view: 'testing' | 'guide') => void
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <nav className="space-y-2">
        <button
          onClick={() => onViewChange('testing')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeView === 'testing'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Beaker className="w-5 h-5" />
          <span className="font-medium">Testing Lab</span>
        </button>

        <button
          onClick={() => onViewChange('guide')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeView === 'guide'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="font-medium">Reference Guide</span>
        </button>
      </nav>

      <div className="mt-8 px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800 font-medium mb-1">Quick Tip</p>
        <p className="text-xs text-blue-600">
          Use the Testing Lab to compare models, then check the Reference Guide for insights.
        </p>
      </div>
    </aside>
  )
}
