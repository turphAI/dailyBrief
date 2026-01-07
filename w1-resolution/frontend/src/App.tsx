import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Zap } from 'lucide-react'
import ResolutionDashboard from './pages/ResolutionDashboard'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <header className="border-b border-purple-500/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-3">
            <Zap className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Resolution Tracker</h1>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<ResolutionDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

