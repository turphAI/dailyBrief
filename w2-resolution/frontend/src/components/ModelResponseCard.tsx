import { Clock, AlertCircle } from 'lucide-react'
import RatingInput from './RatingInput'
import type { ModelResponse, ModelRatings } from '../types'

interface ModelResponseCardProps {
  response: ModelResponse
  showFullResponse?: boolean
  onRatingChange?: (ratings: ModelRatings) => void
}

export default function ModelResponseCard({
  response,
  showFullResponse = false,
  onRatingChange
}: ModelResponseCardProps) {
  const formatTime = (ms: number) => {
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`
  }

  const handleRatingChange = (metric: keyof ModelRatings, value: number) => {
    if (onRatingChange) {
      onRatingChange({
        ...response.ratings,
        [metric]: value
      })
    }
  }

  const getModelDisplayName = (model: string) => {
    const parts = model.split('/')
    return parts[parts.length - 1] || model
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 text-sm mb-1">
          {getModelDisplayName(response.model)}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{formatTime(response.responseTime)}</span>
        </div>
      </div>

      {/* Error State */}
      {response.error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{response.error}</p>
          </div>
        </div>
      )}

      {/* Ratings */}
      {!response.error && (
        <div className="space-y-2 mb-3">
          <RatingInput
            label="Accuracy"
            value={response.ratings?.accuracy}
            onChange={(value) => handleRatingChange('accuracy', value)}
          />
          <RatingInput
            label="Style"
            value={response.ratings?.style}
            onChange={(value) => handleRatingChange('style', value)}
          />
          <RatingInput
            label="Speed"
            value={response.ratings?.speed}
            onChange={(value) => handleRatingChange('speed', value)}
          />
          <RatingInput
            label="X-Factor"
            value={response.ratings?.xFactor}
            onChange={(value) => handleRatingChange('xFactor', value)}
          />
        </div>
      )}

      {/* Full Response (collapsible) */}
      {showFullResponse && !response.error && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {response.response}
          </p>
        </div>
      )}
    </div>
  )
}
