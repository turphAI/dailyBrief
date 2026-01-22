import { useState } from 'react'
import axios from 'axios'
import DocumentEditor from '../components/DocumentEditor'
import SkillsPanel from '../components/SkillsPanel'
import RunSkillDialog from '../components/RunSkillDialog'
import { getDefaultSkills } from '../lib/defaultSkills'
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

  const handleDocumentChange = async (newContent: string) => {
    // Optimistically update
    updateSession({ document: newContent })
  }

  const handleRunSkill = (skill: ResearchSkill) => {
    setSelectedSkill(skill)
    setSkillDialogOpen(true)
  }

  const handleExecuteSkill = async (parameters: Record<string, string>) => {
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

      updateSession({ document: updatedDocument })
    } catch (error) {
      console.error('Failed to run skill:', error)
      throw error
    }
  }

  const handleManageSkills = () => {
    // TODO: Open skill management dialog
    console.log('Manage skills')
  }

  return (
    <div className="h-full flex bg-background">
      {/* Document Editor (Left - Main Area) */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b p-4">
          <h2 className="text-xl font-semibold">Research Document</h2>
          <p className="text-sm text-muted-foreground">
            Run skills to enhance your document, or edit directly
          </p>
        </div>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <DocumentEditor
              content={document}
              onChange={handleDocumentChange}
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
