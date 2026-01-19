import { useState, useRef } from 'react'
import { Loader2, Send, Download, Upload } from 'lucide-react'
import axios from 'axios'
import PromptTestGroup from '../components/PromptTestGroup'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { exportToJSON, importFromJSON } from '../utils/dataExport'
import type { ComparisonResult, ModelRatings } from '../types'

const DEFAULT_MODELS = [
  'openai/gpt-4',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-2.5-flash',
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-large'
]

const PROMPT_TYPES = [
  { value: 'coding', label: 'Coding' },
  { value: 'creative', label: 'Creative' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'conversation', label: 'Conversation' },
  { value: 'technical', label: 'Technical' }
]

export default function TestingLab() {
  const [prompt, setPrompt] = useState('')
  const [promptTitle, setPromptTitle] = useState('')
  const [promptType, setPromptType] = useState('coding')
  const [models] = useState<string[]>(DEFAULT_MODELS)
  const [loading, setLoading] = useState(false)
  const [comparisons, setComparisons] = useLocalStorage<ComparisonResult[]>(
    'modelMapper:comparisons',
    []
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCompare = async () => {
    if (!prompt.trim()) return

    setLoading(true)

    try {
      const response = await axios.post('/api/compare', {
        prompt: prompt.trim(),
        models
      })

      const newComparison: ComparisonResult = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        promptTitle: promptTitle.trim() || 'Untitled Test',
        promptType,
        timestamp: new Date().toISOString(),
        results: response.data.results.map((result: any) => ({
          ...result,
          ratings: {
            accuracy: 0,
            style: 0,
            speed: 0,
            xFactor: 0
          }
        })),
        expanded: true
      }

      setComparisons(prev => [newComparison, ...prev])

      // Clear form
      setPrompt('')
      setPromptTitle('')
    } catch (error) {
      console.error('Comparison failed:', error)
      alert('Failed to compare models. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const handleRatingChange = (comparisonId: string, modelIndex: number, ratings: ModelRatings) => {
    setComparisons(prev =>
      prev.map(comparison =>
        comparison.id === comparisonId
          ? {
              ...comparison,
              results: comparison.results.map((result, index) =>
                index === modelIndex
                  ? { ...result, ratings }
                  : result
              )
            }
          : comparison
      )
    )
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all test results? This cannot be undone.')) {
      setComparisons([])
    }
  }

  const handleExport = () => {
    exportToJSON(comparisons)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await importFromJSON(file)

      if (window.confirm(`Import ${data.length} test(s)? This will replace your current data.`)) {
        setComparisons(data)
      }
    } catch (error) {
      alert(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Testing Lab</h2>
            <p className="text-gray-600">Compare AI model responses and capture evaluation metrics</p>
          </div>
          {comparisons.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-3">
                {comparisons.length} test{comparisons.length !== 1 ? 's' : ''} saved
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleExport}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  Import
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Title
            </label>
            <input
              type="text"
              value={promptTitle}
              onChange={(e) => setPromptTitle(e.target.value)}
              placeholder="e.g., Debug Python Function"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Type
            </label>
            <select
              value={promptType}
              onChange={(e) => setPromptType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              {PROMPT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Models to Compare ({models.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {models.map((model, idx) => (
              <span
                key={idx}
                className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
              >
                {model.split('/')[1] || model}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !prompt.trim()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Comparing Models...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Compare Models
            </>
          )}
        </button>
      </div>

      {/* Comparisons List */}
      {comparisons.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-900">Test Results</h3>
          {comparisons.map((comparison) => (
            <PromptTestGroup
              key={comparison.id}
              comparison={comparison}
              onRatingChange={(modelIndex, ratings) =>
                handleRatingChange(comparison.id, modelIndex, ratings)
              }
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {comparisons.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">
            No tests yet. Create your first comparison above.
          </p>
        </div>
      )}
    </div>
  )
}
