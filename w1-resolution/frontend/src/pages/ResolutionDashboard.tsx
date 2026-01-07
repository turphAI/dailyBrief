import { useState } from 'react'
import { Plus, Send } from 'lucide-react'

export default function ResolutionDashboard() {
  const [resolutions, setResolutions] = useState<any[]>([])
  const [newResolution, setNewResolution] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAddResolution = async () => {
    if (!newResolution.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/resolutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newResolution })
      })
      
      if (response.ok) {
        const data = await response.json()
        setResolutions([...resolutions, data])
        setNewResolution('')
      }
    } catch (error) {
      console.error('Failed to add resolution:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-lg p-8 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Your Resolution Tracker</h2>
        <p className="text-purple-200">Set, monitor, and achieve your goals throughout the year with AI-powered insights.</p>
      </section>

      {/* Input Section */}
      <section className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6 backdrop-blur-sm">
        <label className="block text-sm font-medium text-purple-200 mb-3">Add a New Resolution</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newResolution}
            onChange={(e) => setNewResolution(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddResolution()}
            placeholder="e.g., Read one book per month..."
            className="flex-1 bg-slate-700/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500 transition"
          />
          <button
            onClick={handleAddResolution}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition"
          >
            {isLoading ? 'Adding...' : <>
              <Plus className="w-4 h-4" />
              Add
            </>}
          </button>
        </div>
      </section>

      {/* Resolutions List */}
      <section>
        {resolutions.length === 0 ? (
          <div className="text-center text-purple-300 py-12">
            <p>No resolutions yet. Add one above to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {resolutions.map((resolution) => (
              <div
                key={resolution.id}
                className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6 backdrop-blur-sm hover:border-purple-500/40 transition"
              >
                <h3 className="text-lg font-semibold text-white">{resolution.title}</h3>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

