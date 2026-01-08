import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Target } from 'lucide-react'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b">
          <div className="px-6 py-4 flex items-center gap-3">
            <Target className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Turph's Resolutions</h1>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="h-[calc(100vh-65px)]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

