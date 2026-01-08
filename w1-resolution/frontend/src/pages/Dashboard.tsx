import { useState } from 'react'
import ConversationalInterface from '../components/ConversationalInterface'
import StructuredInterface from '../components/StructuredInterface'

export default function Dashboard() {
  const [resolutions, setResolutions] = useState<any[]>([])
  const [isStructuredExpanded, setIsStructuredExpanded] = useState(false)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversational Interface - Left Panel (Primary) */}
      <div className="flex-1 border-r overflow-hidden">
        <ConversationalInterface 
          resolutions={resolutions}
          setResolutions={setResolutions}
        />
      </div>

      {/* Structured Interface - Right Panel (Supporting) */}
      <div 
        className={`h-full border-l transition-all duration-300 overflow-hidden ${
          isStructuredExpanded ? 'w-96' : 'w-16'
        }`}
      >
        <StructuredInterface 
          resolutions={resolutions}
          isExpanded={isStructuredExpanded}
          onToggleExpanded={() => setIsStructuredExpanded(!isStructuredExpanded)}
        />
      </div>
    </div>
  )
}

