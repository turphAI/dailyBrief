import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import ModelResponseCard from './ModelResponseCard'
import type { ComparisonResult, ModelRatings } from '../types'

interface PromptTestGroupProps {
  comparison: ComparisonResult
  onRatingChange: (modelIndex: number, ratings: ModelRatings) => void
}

export default function PromptTestGroup({ comparison, onRatingChange }: PromptTestGroupProps) {
  const [expanded, setExpanded] = useState(comparison.expanded || false)

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getPromptTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      coding: 'Coding',
      creative: 'Creative',
      analysis: 'Analysis',
      conversation: 'Conversation',
      technical: 'Technical'
    }
    return type ? labels[type] || type : 'General'
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {getPromptTypeLabel(comparison.promptType)}
              </span>
              <span className="text-xs text-gray-500">{formatDate(comparison.timestamp)}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-900">
              {comparison.promptTitle || 'Untitled Test'}
            </h3>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comparison.results.map((result, index) => (
            <ModelResponseCard
              key={index}
              response={result}
              showFullResponse={expanded}
              onRatingChange={(ratings) => onRatingChange(index, ratings)}
            />
          ))}
        </div>
      </div>

      {/* Expandable Prompt and Responses */}
      {expanded && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Prompt</h4>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{comparison.prompt}</p>
          </div>
        </div>
      )}
    </div>
  )
}
