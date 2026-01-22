import { useState } from 'react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Settings, Play, Plus } from 'lucide-react'
import type { ResearchSkill } from '../types'

interface SkillsPanelProps {
  skills: ResearchSkill[]
  onRunSkill: (skill: ResearchSkill) => void
  onManageSkills: () => void
}

export default function SkillsPanel({
  skills,
  onRunSkill,
  onManageSkills
}: SkillsPanelProps) {
  const enabledSkills = skills.filter(s => s.enabled)

  return (
    <div className="flex flex-col h-full bg-muted/30 border-l">
      {/* Header */}
      <div className="p-4 border-b bg-background flex items-center justify-between">
        <h3 className="font-semibold">Research Skills</h3>
        <Button
          onClick={onManageSkills}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Manage Skills"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Skills List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {enabledSkills.map(skill => (
            <div
              key={skill.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md transition-colors"
            >
              <span className="flex-1 text-sm font-medium truncate">
                {skill.name}
              </span>
              <Button
                onClick={() => onRunSkill(skill)}
                size="sm"
                variant="ghost"
                className="h-7 px-2 gap-1 flex-shrink-0"
              >
                <Play className="w-3 h-3" />
                Run
              </Button>
            </div>
          ))}

          {enabledSkills.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No skills enabled</p>
              <p className="text-xs mt-1">Click the settings icon to manage skills</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-background">
        <Button
          onClick={onManageSkills}
          variant="outline"
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Custom Skill
        </Button>
      </div>
    </div>
  )
}
