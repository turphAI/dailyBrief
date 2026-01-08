import { ChevronLeft, ChevronRight, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from './ui/button'

interface StructuredInterfaceProps {
  resolutions: any[]
  isExpanded: boolean
  onToggleExpanded: () => void
}

export default function StructuredInterface({
  resolutions,
  isExpanded,
  onToggleExpanded
}: StructuredInterfaceProps) {
  const activeResolutions = resolutions.filter((r: any) => r.status === 'active')
  const completedResolutions = resolutions.filter((r: any) => r.status === 'completed')
  const resolutionCount = activeResolutions.length

  return (
    <div className="flex flex-col h-full bg-muted/50">
      {/* Toggle Button Stack - Always Visible */}
      <div className="flex flex-col items-center gap-2 p-2 border-b">
        {activeResolutions.map((resolution: any) => (
          <button
            key={resolution.id}
            className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-semibold hover:bg-secondary/80 transition"
            title={resolution.title}
          >
            {resolution.title.charAt(0).toUpperCase()}
          </button>
        ))}
        
        <button
          onClick={onToggleExpanded}
          className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition mt-auto"
        >
          {isExpanded ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Active Resolutions */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-foreground">
              Active ({resolutionCount}/5)
            </h3>
            <div className="space-y-2">
              {activeResolutions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No active resolutions yet. Create one through the chat.
                </p>
              ) : (
                activeResolutions.map((resolution: any) => (
                  <div
                    key={resolution.id}
                    className="p-3 bg-background border rounded-lg space-y-2"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {resolution.title}
                    </p>
                    {resolution.measurable && (
                      <p className="text-xs text-muted-foreground">
                        📊 {resolution.measurable}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          // TODO: Mark as complete
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // TODO: Delete resolution
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed Resolutions */}
          {completedResolutions.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 text-foreground">
                Completed ({completedResolutions.length})
              </h3>
              <div className="space-y-2">
                {completedResolutions.map((resolution: any) => (
                  <div
                    key={resolution.id}
                    className="p-3 bg-background border rounded-lg opacity-60"
                  >
                    <p className="text-sm font-medium text-foreground line-through">
                      {resolution.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p>
              ✨ Use the conversational interface to manage your resolutions. This panel shows a quick view of your progress.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

