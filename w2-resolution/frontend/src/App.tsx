import { useState } from 'react'
import { Loader2, Send, Clock, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'
import type { ModelResponse, ComparisonResult } from './types'

const DEFAULT_MODELS = [
  'openai/gpt-4',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-pro',
  'meta-llama/llama-3.2-90b-vision-instruct',
  'mistralai/mistral-large'
]

function App() {
  const [prompt, setPrompt] = useState('')
  const [models, setModels] = useState<string[]>(DEFAULT_MODELS)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ModelResponse[]>([])
  const [history, setHistory] = useState<ComparisonResult[]>([])

  const handleCompare = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setResults([])

    try {
      const response = await axios.post('/api/compare', {
        prompt: prompt.trim(),
        models
      })

      const comparisonResult: ComparisonResult = {
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(),
        results: response.data.results
      }

      setResults(response.data.results)
      setHistory(prev => [comparisonResult, ...prev])
    } catch (error) {
      console.error('Comparison failed:', error)
      alert('Failed to compare models. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (ms: number) => {
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Model Mapper</h1>
          <p className="text-gray-600">Compare AI model responses side-by-side</p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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
            <div className="text-xs text-gray-500 space-y-1">
              {models.map((model, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {model}
                </div>
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

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {result.model}
                    </h3>
                    {result.error ? (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(result.responseTime)}</span>
                  </div>

                  {result.error ? (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                      {result.error}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {result.response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">History</h2>
            <div className="space-y-4">
              {history.map((item, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {item.prompt}
                    </p>
                    <span className="text-xs text-gray-500 ml-4 flex-shrink-0">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {item.results.map((result, ridx) => (
                      <span
                        key={ridx}
                        className={`text-xs px-2 py-1 rounded ${
                          result.error
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {result.model.split('/')[1] || result.model}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
