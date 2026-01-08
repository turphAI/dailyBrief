import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, PieChart, PartyPopper, Settings2 } from 'lucide-react'
import ResolutionRadar from './ResolutionRadar'
import ResolutionDetailView from './ResolutionDetailView'
import {
  resolutionToRadarData,
  categorizeTier,
  calculateProgress,
} from '../utils/resolutionViz'

type ViewType = 'dashboard' | 'resolutions' | 'detail' | 'settings'
type NavState = 'collapsed' | 'transition' | 'open'

const TRANSITION_DURATION = 300 // ms

interface StructuredInterfaceProps {
  resolutions: any[]
  isExpanded: boolean
  onToggleExpanded: () => void
}

export default function StructuredInterface({
  resolutions,
  isExpanded,
  onToggleExpanded,
}: StructuredInterfaceProps) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [selectedResolutionId, setSelectedResolutionId] = useState<string | null>(null)
  const [navState, setNavState] = useState<NavState>(isExpanded ? 'open' : 'collapsed')
  
  const activeResolutions = resolutions.filter((r: any) => r.status === 'active')
  const completedResolutions = resolutions.filter((r: any) => r.status === 'completed')

  const radarData = resolutionToRadarData(activeResolutions)
  const selectedResolution = activeResolutions.find(
    (r: any) => r.id === selectedResolutionId
  )

  // Sync navState with isExpanded prop changes
  useEffect(() => {
    if (isExpanded && navState === 'collapsed') {
      setNavState('transition')
      setTimeout(() => setNavState('open'), TRANSITION_DURATION)
    } else if (!isExpanded && navState === 'open') {
      setNavState('transition')
      setTimeout(() => setNavState('collapsed'), TRANSITION_DURATION)
    }
  }, [isExpanded])

  const isClickable = navState !== 'transition'

  // Handle nav icon click when collapsed (triggers expand + navigate)
  const handleNavClick = (view: ViewType) => {
    if (!isClickable) return
    
    if (navState === 'collapsed') {
      // Collapsed: expand and navigate
      setCurrentView(view)
      setSelectedResolutionId(null)
      onToggleExpanded()
    } else if (navState === 'open') {
      // Open: just navigate (no state change)
      setCurrentView(view)
      setSelectedResolutionId(null)
    }
  }

  // Handle collapse toggle click
  const handleCollapseClick = () => {
    if (!isClickable) return
    onToggleExpanded()
  }

  const handleResolutionClick = (resolutionName: string) => {
    const resolution = activeResolutions.find((r: any) =>
      r.title.toLowerCase().includes(resolutionName.toLowerCase())
    )
    if (resolution) {
      setSelectedResolutionId(resolution.id)
      setCurrentView('detail')
    }
  }

  const handleResolutionSelect = (id: string) => {
    setSelectedResolutionId(id)
    setCurrentView('detail')
  }

  const handleBackToResolutions = () => {
    setSelectedResolutionId(null)
    setCurrentView('resolutions')
  }

  // Nav button component for reuse
  const NavButton = ({ 
    view, 
    icon: Icon, 
    title,
    isActive 
  }: { 
    view: ViewType
    icon: typeof PieChart
    title: string
    isActive: boolean
  }) => (
    <button
      onClick={() => handleNavClick(view)}
      disabled={!isClickable}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
        navState === 'open' && isActive
          ? 'bg-primary text-primary-foreground shadow-lg'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      } ${!isClickable ? 'cursor-not-allowed opacity-70' : ''}`}
      title={title}
    >
      <Icon className="w-5 h-5" />
    </button>
  )

  const isCollapsedLayout = navState === 'collapsed' || (navState === 'transition' && !isExpanded)

  return (
    <div className="flex flex-col h-full bg-muted/50">
      {/* Navigation */}
      <div 
        className={`flex items-center gap-2 p-2 transition-all duration-300 ${
          isCollapsedLayout
            ? 'flex-col justify-center h-full'
            : 'flex-row border-b'
        }`}
      >
        <NavButton 
          view="dashboard" 
          icon={PieChart} 
          title="Dashboard"
          isActive={currentView === 'dashboard'}
        />
        <NavButton 
          view="resolutions" 
          icon={PartyPopper} 
          title="Resolutions"
          isActive={currentView === 'resolutions' || currentView === 'detail'}
        />
        <NavButton 
          view="settings" 
          icon={Settings2} 
          title="Settings"
          isActive={currentView === 'settings'}
        />

        {/* Expand/Collapse Toggle */}
        <button
          onClick={handleCollapseClick}
          disabled={!isClickable}
          className={`w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-all duration-300 ${
            isCollapsedLayout ? 'mt-4' : 'ml-auto'
          } ${!isClickable ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          {navState === 'open' || (navState === 'transition' && isExpanded) ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div 
        className={`flex-1 overflow-hidden transition-all duration-300 ${
          navState === 'open' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {(navState === 'open' || navState === 'transition') && (
          <div className="h-full overflow-y-auto p-4">
            {/* Dashboard View */}
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-2">
                    Dashboard
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Overview of your resolution progress
                  </p>
                </div>

                {activeResolutions.length > 0 ? (
                  <div>
                    <ResolutionRadar
                      data={radarData}
                      onResolutionClick={handleResolutionClick}
                    />
                  </div>
                ) : (
                  <div className="bg-background border rounded-lg p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      No active resolutions yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Create one through the chat to get started
                    </p>
                  </div>
                )}

                {completedResolutions.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      🎉 {completedResolutions.length} resolution{completedResolutions.length !== 1 ? 's' : ''} completed
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <p>
                    ✨ Use the conversational interface to manage your resolutions.
                  </p>
                </div>
              </div>
            )}

            {/* Resolutions List View */}
            {currentView === 'resolutions' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-2">
                    Resolutions
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Click on a resolution to view details
                  </p>
                </div>

                {activeResolutions.length > 0 ? (
                  <div className="space-y-3">
                    {activeResolutions.map((resolution: any, index: number) => {
                      const tier = categorizeTier(resolution, activeResolutions, index)
                      const progress = calculateProgress(resolution)
                      const tierColors = {
                        immediate: 'bg-orange-500',
                        secondary: 'bg-blue-500',
                        maintenance: 'bg-green-500',
                      }
                      
                      return (
                        <button
                          key={resolution.id}
                          onClick={() => handleResolutionSelect(resolution.id)}
                          className="w-full text-left bg-background border rounded-lg p-3 hover:border-primary/50 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${tierColors[tier]}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {resolution.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-8">
                                  {progress}%
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-background border rounded-lg p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      No active resolutions yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Create one through the chat to get started
                    </p>
                  </div>
                )}

                {completedResolutions.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Completed ({completedResolutions.length})
                    </h3>
                    <div className="space-y-2">
                      {completedResolutions.map((resolution: any) => (
                        <div
                          key={resolution.id}
                          className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-2 flex items-center gap-2"
                        >
                          <span className="text-green-500">✓</span>
                          <span className="truncate">{resolution.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detail View */}
            {currentView === 'detail' && selectedResolution && (
              <ResolutionDetailView
                resolution={selectedResolution}
                tier={categorizeTier(
                  selectedResolution,
                  activeResolutions,
                  activeResolutions.findIndex((r) => r.id === selectedResolution.id)
                )}
                progress={calculateProgress(selectedResolution)}
                onBack={handleBackToResolutions}
                onComplete={(id) => {
                  console.log('Complete resolution:', id)
                }}
                onDelete={(id) => {
                  console.log('Delete resolution:', id)
                }}
              />
            )}

            {/* Settings View */}
            {currentView === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-2">
                    Settings
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Configure your preferences
                  </p>
                </div>

                <div className="bg-background border rounded-lg p-8 text-center">
                  <Settings2 className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Settings coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
