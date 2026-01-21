import { useState, useEffect } from 'react'
import { FileText, Download, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { ScrollArea } from '../components/ui/scroll-area'
import axios from 'axios'
import type { ResearchSession } from '../types'

interface ResearchDocumentViewProps {
  session: ResearchSession
}

export default function ResearchDocumentView({ session }: ResearchDocumentViewProps) {
  const [document, setDocument] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)

  // Load document on mount or when session changes significantly
  useEffect(() => {
    if (session.queries.length > 0 || session.resources.length > 0) {
      loadDocument()
    }
  }, [session.id])

  const loadDocument = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/w3?action=generate-document', {
        sessionId: session.id,
        topic: session.topic,
        description: session.description,
        queries: session.queries,
        resources: session.resources,
        threads: session.threads || []
      })

      setDocument(response.data.document)
      setLastGenerated(new Date().toISOString())
    } catch (err) {
      console.error('Failed to generate document:', err)
      setError('Failed to generate research document')

      // Fallback to basic document structure
      generateFallbackDocument()
    } finally {
      setLoading(false)
    }
  }

  const generateFallbackDocument = () => {
    // Create a simple markdown document from available data
    let doc = `# ${session.topic}\n\n`

    if (session.description) {
      doc += `${session.description}\n\n`
    }

    if (session.queries.length > 0) {
      doc += `## Research Findings\n\n`
      session.queries.slice(0, 10).forEach((query, index) => {
        doc += `### ${index + 1}. ${query.question}\n\n`
        if (query.response) {
          doc += `${query.response}\n\n`
        }
      })
    }

    if (session.resources.length > 0) {
      doc += `## Resources\n\n`
      session.resources.forEach(resource => {
        doc += `- **${resource.title || resource.url || 'Untitled'}**`
        if (resource.url) {
          doc += ` - [Link](${resource.url})`
        }
        if (resource.notes) {
          doc += `\n  ${resource.notes}`
        }
        doc += `\n`
      })
    }

    setDocument(doc)
    setLastGenerated(new Date().toISOString())
  }

  const handleDownload = () => {
    if (!document) return

    const blob = new Blob([document], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-research.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Show empty state if no content
  if (!loading && session.queries.length === 0 && session.resources.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Research Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start by asking questions in the Working Area or adding resources. Your research
            document will automatically generate as you work.
          </p>
          <Button onClick={loadDocument} disabled={loading}>
            Generate Document
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Research Document
          </h2>
          {lastGenerated && (
            <p className="text-sm text-muted-foreground">
              Last updated {new Date(lastGenerated).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadDocument}
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!document}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error} - Showing basic document structure
        </div>
      )}

      {/* Document Content */}
      <ScrollArea className="flex-1 p-8">
        {loading && !document ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Generating research document...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {/* Simple markdown rendering - in production use a proper markdown library */}
              <div className="whitespace-pre-wrap">
                {document?.split('\n').map((line, index) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={index} className="text-3xl font-bold mb-4 mt-8">{line.slice(2)}</h1>
                  } else if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-2xl font-semibold mb-3 mt-6">{line.slice(3)}</h2>
                  } else if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-xl font-semibold mb-2 mt-4">{line.slice(4)}</h3>
                  } else if (line.startsWith('- ')) {
                    return <li key={index} className="ml-4 mb-1">{line.slice(2)}</li>
                  } else if (line.trim() === '') {
                    return <div key={index} className="h-4" />
                  } else {
                    return <p key={index} className="mb-2 leading-relaxed">{line}</p>
                  }
                })}
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
