import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from './ui/sheet'
import { Loader2 } from 'lucide-react'
import type { ResearchSkill } from '../types'

interface RunSkillDialogProps {
  skill: ResearchSkill | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRun: (parameters: Record<string, string>) => Promise<void>
}

export default function RunSkillDialog({
  skill,
  open,
  onOpenChange,
  onRun
}: RunSkillDialogProps) {
  const [parameters, setParameters] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!skill) return null

  const handleRun = async () => {
    // Validate required parameters
    const missingParams = skill.parameters
      .filter(p => p.required && !parameters[p.name]?.trim())
      .map(p => p.name)

    if (missingParams.length > 0) {
      setError(`Required parameters missing: ${missingParams.join(', ')}`)
      return
    }

    setRunning(true)
    setError(null)

    try {
      await onRun(parameters)
      onOpenChange(false)
      setParameters({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run skill')
    } finally {
      setRunning(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    setParameters({})
    setError(null)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[525px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-2xl">{skill.icon}</span>
            {skill.name}
          </SheetTitle>
          <SheetDescription>{skill.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {skill.parameters.map(param => (
            <div key={param.name} className="space-y-2">
              <label className="text-sm font-medium">
                {param.name.charAt(0).toUpperCase() + param.name.slice(1)}
                {param.required && <span className="text-destructive ml-1">*</span>}
              </label>
              {param.description && (
                <p className="text-xs text-muted-foreground">{param.description}</p>
              )}
              {param.type === 'textarea' ? (
                <Textarea
                  value={parameters[param.name] || ''}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    [param.name]: e.target.value
                  }))}
                  placeholder={param.placeholder}
                  rows={4}
                />
              ) : (
                <Input
                  value={parameters[param.name] || ''}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    [param.name]: e.target.value
                  }))}
                  placeholder={param.placeholder}
                />
              )}
            </div>
          ))}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <SheetFooter className="gap-2">
          <Button onClick={handleCancel} variant="outline" disabled={running}>
            Cancel
          </Button>
          <Button onClick={handleRun} disabled={running}>
            {running ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              'Run Skill'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
