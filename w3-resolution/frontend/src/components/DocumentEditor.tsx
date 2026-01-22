import { useRef, useEffect } from 'react'
import { Textarea } from './ui/textarea'
import { FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface DocumentEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  mode?: 'display' | 'markdown'
}

export default function DocumentEditor({
  content,
  onChange,
  placeholder = "# Your Research Document\n\nStart by running a skill from the right panel, or type here to add your own content...",
  mode = 'display'
}: DocumentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [content])

  if (!content) {
    // Empty state
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Document Yet</h3>
          <p className="text-sm text-muted-foreground">
            Run a research skill from the right panel to start building your document,
            or switch to markdown mode to start typing.
          </p>
        </div>
      </div>
    )
  }

  if (mode === 'display') {
    // Display mode - rendered markdown (read-only)
    return (
      <div className="h-full w-full prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  // Markdown mode - editable textarea
  return (
    <div className="h-full w-full">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-full min-h-full resize-none font-mono text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        style={{
          minHeight: '100%',
          overflow: 'auto'
        }}
      />
    </div>
  )
}
