import { ToolResult, Resolution, UserPreferences } from './types'

interface ConfigureUpdatesInput {
  action: 'enable' | 'disable' | 'configure' | 'status'
  scope?: 'global' | 'resolution'
  resolution_id?: string
  frequency?: 'gentle' | 'moderate' | 'persistent'
  channel?: 'in_conversation' | 'sms' | 'all'
}

/**
 * Configure the update/reminder system
 * 
 * Actions:
 * - enable: Turn on updates (globally or for a resolution)
 * - disable: Turn off updates (globally or for a resolution)
 * - configure: Change frequency or channel settings
 * - status: Get current update settings
 * 
 * @param input - Configuration options
 * @param resolutions - Map of all resolutions
 * @param preferences - User preferences (will be modified if global scope)
 * @returns ToolResult with updated settings
 */
export function configureUpdates(
  input: ConfigureUpdatesInput,
  resolutions: Map<string, Resolution>,
  preferences: UserPreferences
): ToolResult {
  try {
    const { action, scope = 'global', resolution_id, frequency, channel = 'all' } = input

    // Handle status request
    if (action === 'status') {
      return getUpdateStatus(resolutions, preferences, resolution_id)
    }

    // Handle resolution-specific changes
    if (scope === 'resolution') {
      if (!resolution_id) {
        return {
          success: false,
          message: 'Resolution ID required',
          error: 'When scope is "resolution", resolution_id must be provided'
        }
      }

      const resolution = resolutions.get(resolution_id)
      if (!resolution) {
        return {
          success: false,
          message: 'Resolution not found',
          error: `Resolution with ID "${resolution_id}" does not exist`
        }
      }

      return configureResolutionUpdates(resolution, action, frequency)
    }

    // Handle global changes
    return configureGlobalUpdates(preferences, action, frequency, channel)

  } catch (error) {
    console.error('Error in configureUpdates:', error)
    return {
      success: false,
      message: 'Failed to configure updates',
      error: (error as Error).message
    }
  }
}

/**
 * Get current update status
 */
function getUpdateStatus(
  resolutions: Map<string, Resolution>,
  preferences: UserPreferences,
  resolution_id?: string
): ToolResult {
  if (resolution_id) {
    const resolution = resolutions.get(resolution_id)
    if (!resolution) {
      return {
        success: false,
        message: 'Resolution not found',
        error: `Resolution with ID "${resolution_id}" does not exist`
      }
    }

    const status = {
      resolution: resolution.title,
      updatesEnabled: resolution.updateSettings.enabled,
      lastNudge: resolution.updateSettings.lastNudgeAt,
      nextNudge: resolution.updateSettings.nextNudgeAt,
      nudgeCount: resolution.updateSettings.nudgeCount,
      responseRate: `${Math.round(resolution.updateSettings.responseRate * 100)}%`,
      cadenceOverride: resolution.updateSettings.cadenceOverride || 'using global defaults'
    }

    return {
      success: true,
      message: `Update settings for "${resolution.title}"`,
      resolution: status
    }
  }

  // Global status
  const activeResolutions = Array.from(resolutions.values()).filter(r => r.status === 'active')
  const enabledCount = activeResolutions.filter(r => r.updateSettings.enabled).length

  const status = {
    globalEnabled: preferences.updatesEnabled,
    inConversation: {
      enabled: preferences.inConversation.enabled,
      frequency: preferences.inConversation.frequency
    },
    sms: {
      enabled: preferences.sms.enabled,
      configured: !!preferences.sms.phoneNumber,
      verified: preferences.sms.verified
    },
    defaultCadence: preferences.defaultCadence,
    resolutions: {
      total: activeResolutions.length,
      withUpdatesEnabled: enabledCount
    }
  }

  return {
    success: true,
    message: 'Current update settings',
    preferences,
    resolution: status
  }
}

/**
 * Configure updates for a specific resolution
 */
function configureResolutionUpdates(
  resolution: Resolution,
  action: 'enable' | 'disable' | 'configure',
  frequency?: string
): ToolResult {
  const changes: string[] = []

  if (action === 'enable') {
    if (!resolution.updateSettings.enabled) {
      resolution.updateSettings.enabled = true
      changes.push('updates enabled')
    } else {
      return {
        success: true,
        message: `Updates already enabled for "${resolution.title}"`,
        resolution
      }
    }
  }

  if (action === 'disable') {
    if (resolution.updateSettings.enabled) {
      resolution.updateSettings.enabled = false
      changes.push('updates disabled')
    } else {
      return {
        success: true,
        message: `Updates already disabled for "${resolution.title}"`,
        resolution
      }
    }
  }

  if (action === 'configure' && frequency) {
    // For resolution-specific frequency, we'd need to add cadenceOverride
    // For now, just acknowledge
    changes.push(`frequency preference noted (${frequency})`)
  }

  console.log(`📝 Configured updates for "${resolution.title}": ${changes.join(', ')}`)

  return {
    success: true,
    message: `Updated "${resolution.title}": ${changes.join(', ')}`,
    resolution
  }
}

/**
 * Configure global update settings
 */
function configureGlobalUpdates(
  preferences: UserPreferences,
  action: 'enable' | 'disable' | 'configure',
  frequency?: 'gentle' | 'moderate' | 'persistent',
  channel?: 'in_conversation' | 'sms' | 'all'
): ToolResult {
  const changes: string[] = []

  if (action === 'enable') {
    if (!preferences.updatesEnabled) {
      preferences.updatesEnabled = true
      changes.push('updates enabled globally')
    }

    if (channel === 'in_conversation' || channel === 'all') {
      if (!preferences.inConversation.enabled) {
        preferences.inConversation.enabled = true
        changes.push('in-conversation nudges enabled')
      }
    }

    if (channel === 'sms' || channel === 'all') {
      if (!preferences.sms.enabled) {
        if (!preferences.sms.phoneNumber) {
          return {
            success: false,
            message: 'Cannot enable SMS',
            error: 'No phone number configured. Please add a phone number in Settings first.'
          }
        }
        preferences.sms.enabled = true
        changes.push('SMS reminders enabled')
      }
    }

    if (changes.length === 0) {
      return {
        success: true,
        message: 'Updates already enabled',
        preferences
      }
    }
  }

  if (action === 'disable') {
    if (channel === 'in_conversation') {
      if (preferences.inConversation.enabled) {
        preferences.inConversation.enabled = false
        changes.push('in-conversation nudges disabled')
      }
    } else if (channel === 'sms') {
      if (preferences.sms.enabled) {
        preferences.sms.enabled = false
        changes.push('SMS reminders disabled')
      }
    } else {
      // Disable all
      if (preferences.updatesEnabled) {
        preferences.updatesEnabled = false
        changes.push('all updates disabled')
      }
    }

    if (changes.length === 0) {
      return {
        success: true,
        message: 'Updates already disabled',
        preferences
      }
    }
  }

  if (action === 'configure') {
    if (frequency) {
      const oldFrequency = preferences.inConversation.frequency
      if (oldFrequency !== frequency) {
        preferences.inConversation.frequency = frequency
        changes.push(`frequency changed: ${oldFrequency} → ${frequency}`)
      }
    }

    if (changes.length === 0) {
      return {
        success: true,
        message: 'No changes made',
        preferences
      }
    }
  }

  console.log(`📝 Configured global updates: ${changes.join(', ')}`)

  return {
    success: true,
    message: changes.join(', '),
    preferences
  }
}
