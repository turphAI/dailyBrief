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
        <div className="p-4 space-y-3">
          {enabledSkills.map(skill => (
            <div
              key={skill.id}
              className="bg-background rounded-lg border p-3 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">{skill.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1">{skill.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    {skill.description}
                  </p>
                  <Button
                    onClick={() => onRunSkill(skill)}
                    size="sm"
                    className="w-full gap-2"
                  >
                    <Play className="w-3 h-3" />
                    Run Skill
                  </Button>
                </div>
              </div>
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
