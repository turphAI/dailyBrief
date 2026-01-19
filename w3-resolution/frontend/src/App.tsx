import { useState } from 'react'
import Header from './components/Header'
import ResearchView from './views/ResearchView'

function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 overflow-auto">
        <ResearchView />
      </main>
    </div>
  )
}

export default App
