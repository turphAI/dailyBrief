import { useState } from 'react'
import axios from 'axios'
import DocumentEditor from '../components/DocumentEditor'
import SkillsPanel from '../components/SkillsPanel'
import RunSkillDialog from '../components/RunSkillDialog'
import { getDefaultSkills } from '../lib/defaultSkills'
import { Button } from '../components/ui/button'
import { Sparkles, X, ALargeSmall, Hash } from 'lucide-react'
import type { ResearchSession, ResearchSkill } from '../types'

interface DocumentViewProps {
  session: ResearchSession
  updateSession: (updates: Partial<ResearchSession>) => void
}

export default function DocumentView({
  session,
  updateSession
}: DocumentViewProps) {
  // Initialize skills if not present
  const skills = session.skills || getDefaultSkills()
  const document = session.document || ''

  const [selectedSkill, setSelectedSkill] = useState<ResearchSkill | null>(null)
  const [skillDialogOpen, setSkillDialogOpen] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(false)
  const [viewMode, setViewMode] = useState<'display' | 'markdown'>('display')

  const skillRunsSinceOrganize = session.skillRunsSinceOrganize || 0
  const shouldShowHint = skillRunsSinceOrganize >= 3 && !hintDismissed

  const handleDocumentChange = async (newContent: string) => {
    // Optimistically update
    updateSession({ document: newContent })
  }

  const handleRunSkill = (skill: ResearchSkill) => {
    setSelectedSkill(skill)
    setSkillDialogOpen(true)
  }

  const handleExecuteSkill = async (parameters: Record<string, string>, destination: 'working' | 'document') => {
    if (!selectedSkill) return

    try {
      const response = await axios.post(
        '/api/w3?action=run-skill',
        {
          sessionId: session.id,
          skillId: selectedSkill.id,
          skill: selectedSkill,
          topic: session.topic,
          description: session.description,
          parameters,
          documentContext: document
        },
        {
          timeout: 60000 // 60 second timeout
        }
      )

      const result = response.data.result

      if (destination === 'working') {
        // Generate title from content or parameters
        let title = ''

        // Try to use the main parameter value (first parameter)
        const firstParam = Object.values(parameters)[0]
        if (firstParam && typeof firstParam === 'string') {
          title = firstParam.slice(0, 60)
        }

        // Fallback: extract from first line of content
        if (!title) {
          const firstLine = result.split('\n')[0].replace(/^#+\s*/, '').trim()
          title = firstLine.slice(0, 60)
        }

        // Final fallback: use skill name
        if (!title) {
          title = selectedSkill.name
        }

        // Add to working blocks
        const newBlock = {
          id: Date.now().toString(),
          title,
          content: result,
          skillId: selectedSkill.id,
          skillName: selectedSkill.name,
          parameters,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        updateSession({
          workingBlocks: [...(session.workingBlocks || []), newBlock]
        })
      } else {
        // Insert result into document based on target strategy
        let updatedDocument = document

        switch (selectedSkill.targetStrategy) {
          case 'new-section':
            // Append to end of document with spacing
            updatedDocument = document
              ? `${document}\n\n---\n\n${result}`
              : result
            break

          case 'append-to-section':
            // Append to end (TODO: implement section selection in future)
            updatedDocument = document
              ? `${document}\n\n${result}`
              : result
            break

          case 'replace-selection':
            // Replace entire document (used by Organize & Consolidate)
            updatedDocument = result
            break

          case 'insert-at-cursor':
            // For now, append to end (TODO: implement cursor position tracking)
            updatedDocument = document
              ? `${document}\n\n${result}`
              : result
            break
        }

        // Track skill runs for hint system
        let newSkillRunCount = skillRunsSinceOrganize

        if (selectedSkill.id === 'organize-document') {
          // Reset counter when organizing
          newSkillRunCount = 0
          setHintDismissed(false)
        } else {
          // Increment counter for content skills
          newSkillRunCount = skillRunsSinceOrganize + 1
        }

        updateSession({
          document: updatedDocument,
          skillRunsSinceOrganize: newSkillRunCount
        })
      }
    } catch (error) {
      console.error('Failed to run skill:', error)
      throw error
    }
  }

  const handleManageSkills = () => {
    // TODO: Open skill management dialog
    console.log('Manage skills')
  }

  const handleRunOrganizeSkill = () => {
    const organizeSkill = skills.find(s => s.id === 'organize-document')
    if (organizeSkill) {
      handleRunSkill(organizeSkill)
    }
  }

  return (
    <div className="h-full flex bg-background">
      {/* Document Editor (Left - Main Area) */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Research Document</h2>
            <p className="text-sm text-muted-foreground">
              Run skills to enhance your document, or edit directly
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'display' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('display')}
              className="h-8 w-8 p-0"
            >
              <ALargeSmall className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'markdown' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('markdown')}
              className="h-8 w-8 p-0"
            >
              <Hash className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Organization Hint */}
        {shouldShowHint && (
          <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-4 py-3 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Document could use organization
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                You've run {skillRunsSinceOrganize} skills. Consider running "Organize & Consolidate" to structure your document.
              </p>
            </div>
            <Button
              onClick={handleRunOrganizeSkill}
              size="sm"
              variant="default"
              className="flex-shrink-0"
            >
              Organize Now
            </Button>
            <Button
              onClick={() => setHintDismissed(true)}
              size="sm"
              variant="ghost"
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <DocumentEditor
              content={document}
              onChange={handleDocumentChange}
              mode={viewMode}
            />
          </div>
        </div>
      </div>

      {/* Skills Panel (Right Sidebar) */}
      <div className="w-80 flex-shrink-0">
        <SkillsPanel
          skills={skills}
          onRunSkill={handleRunSkill}
          onManageSkills={handleManageSkills}
        />
      </div>

      {/* Run Skill Dialog */}
      <RunSkillDialog
        skill={selectedSkill}
        open={skillDialogOpen}
        onOpenChange={setSkillDialogOpen}
        onRun={handleExecuteSkill}
      />
    </div>
  )
}
