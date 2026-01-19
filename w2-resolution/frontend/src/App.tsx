import { useState } from 'react'
import AppShell from './components/AppShell'
import TestingLab from './views/TestingLab'
import ReferenceGuide from './views/ReferenceGuide'

function App() {
  const [activeView, setActiveView] = useState<'testing' | 'guide'>('testing')

  return (
    <AppShell activeView={activeView} onViewChange={setActiveView}>
      {activeView === 'testing' ? <TestingLab /> : <ReferenceGuide />}
    </AppShell>
  )
}

export default App
