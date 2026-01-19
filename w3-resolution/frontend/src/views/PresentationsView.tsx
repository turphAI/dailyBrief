import { useState } from 'react'
import { Presentation, Plus, Users, FilePresentation, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Presentation as PresentationType } from '../types'

interface PresentationsViewProps {
  presentations: PresentationType[]
  onAddPresentation?: (presentation: Omit<PresentationType, 'id' | 'createdAt' | 'updatedAt'>) => void
  onRemovePresentation?: (presentationId: string) => void
  onUpdatePresentation?: (presentationId: string, updates: Partial<PresentationType>) => void
}

export default function PresentationsView({
  presentations
}: PresentationsViewProps) {
  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">Presentations</h2>
            <p className="text-muted-foreground mt-2">
              Generate presentations for different audiences and versions
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-2 border-dashed">
        <CardContent className="text-center py-16">
          <FilePresentation className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-2xl font-semibold mb-3">Presentations Coming Soon</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            This feature will allow you to create and manage presentations based on your research.
            Generate multiple versions tailored to different target audiences.
          </p>

          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
            <Card>
              <CardContent className="pt-6">
                <Layers className="w-8 h-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Multiple Versions</h4>
                <p className="text-sm text-muted-foreground">
                  Create different versions of presentations for various contexts and detail levels
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Target Audiences</h4>
                <p className="text-sm text-muted-foreground">
                  Customize content and complexity for executives, technical teams, or general audiences
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Presentation className="w-8 h-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">AI-Powered Generation</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically generate slides from your research findings and resources
                </p>
              </CardContent>
            </Card>
          </div>

          {/* TODO Badge */}
          <div className="mt-8">
            <Badge variant="outline" className="text-sm px-4 py-2">
              📋 TODO: Design presentation templates in Figma
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for future presentations list */}
      {presentations.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold">Your Presentations</h3>
          {presentations.map((presentation) => (
            <Card key={presentation.id}>
              <CardHeader>
                <CardTitle>{presentation.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge>{presentation.version}</Badge>
                  <Badge variant="secondary">{presentation.targetAudience}</Badge>
                </div>
                {presentation.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {presentation.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
