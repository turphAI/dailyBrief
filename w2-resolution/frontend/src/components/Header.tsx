import { Brain } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">
          Turph's Model Mapping
        </h1>
      </div>
    </header>
  )
}
