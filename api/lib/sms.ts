/**
 * SMS Service - Amazon SNS Integration
 * 
 * Handles SMS delivery for resolution nudges.
 * Currently stubbed for development - full SNS integration when ready.
 */

import type { Resolution, UserPreferences, NudgeRecord } from './db'

// ============================================================================
// Configuration
// ============================================================================

export interface SMSConfig {
  enabled: boolean
  region: string
  accessKeyId?: string
  secretAccessKey?: string
}

function getSMSConfig(): SMSConfig {
  return {
    enabled: !!process.env.AWS_SNS_ENABLED,
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}

export function isSMSConfigured(): boolean {
  const config = getSMSConfig()
  return config.enabled && !!config.accessKeyId && !!config.secretAccessKey
}

// ============================================================================
// Message Templates
// ============================================================================

export type SMSTemplateType = 'check_in' | 'encouragement' | 'milestone' | 'streak' | 'gentle_nudge'

interface SMSTemplate {
  type: SMSTemplateType
  templates: string[]
}

const SMS_TEMPLATES: SMSTemplate[] = [
  {
    type: 'check_in',
    templates: [
      'Hey! How\'s "{title}" going? Quick update?',
      'Checking in on "{title}" - how are things progressing?',
      'Hi! Any updates on "{title}"? 📊'
    ]
  },
  {
    type: 'gentle_nudge',
    templates: [
      'It\'s been a bit since we talked about "{title}". Everything okay?',
      'Just thinking about your "{title}" goal. How\'s it coming along?',
      'Hey, wanted to check in on "{title}". Still on track?'
    ]
  },
  {
    type: 'encouragement',
    templates: [
      'Remember, setbacks are part of the journey. How can I help with "{title}"?',
      'Thinking of you and "{title}". Small steps count! How are you doing?',
      'Progress isn\'t always linear. How\'s "{title}" feeling today?'
    ]
  },
  {
    type: 'streak',
    templates: [
      'You\'ve been crushing it with "{title}"! 🔥 Keep the momentum going!',
      'Loving your consistency on "{title}"! How\'s today going?',
      'That streak on "{title}" is impressive! Still going strong? 💪'
    ]
  },
  {
    type: 'milestone',
    templates: [
      'Getting close to a milestone on "{title}"! How\'s progress?',
      'You might be hitting a milestone soon on "{title}"! Update? 🎯',
      'Big things happening with "{title}"? Let me know! ✨'
    ]
  }
]

/**
 * Generate SMS message from template
 */
export function generateSMSMessage(
  type: SMSTemplateType,
  resolution: Resolution
): string {
  const templateGroup = SMS_TEMPLATES.find(t => t.type === type)
  if (!templateGroup) {
    return `How's "${resolution.title}" going?`
  }

  // Pick random template from the group
  const template = templateGroup.templates[
    Math.floor(Math.random() * templateGroup.templates.length)
  ]

  return template.replace('{title}', resolution.title)
}

// ============================================================================
// Phone Number Validation
// ============================================================================

/**
 * Validate and normalize phone number to E.164 format
 */
export function normalizePhoneNumber(phone: string): { valid: boolean; normalized: string | null; error?: string } {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // If starts with +, keep it; otherwise assume US number
  if (!cleaned.startsWith('+')) {
    // Remove leading 1 if present (US country code)
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = '+' + cleaned
    } else if (cleaned.length === 10) {
      cleaned = '+1' + cleaned
    } else {
      return { 
        valid: false, 
        normalized: null, 
        error: 'Invalid phone number format. Use 10 digits for US or include country code.' 
      }
    }
  }

  // Basic E.164 validation (+ followed by 10-15 digits)
  const e164Regex = /^\+[1-9]\d{9,14}$/
  if (!e164Regex.test(cleaned)) {
    return { 
      valid: false, 
      normalized: null, 
      error: 'Phone number must be in E.164 format (e.g., +1234567890)' 
    }
  }

  return { valid: true, normalized: cleaned }
}

// ============================================================================
// Quiet Hours Check
// ============================================================================

/**
 * Check if current time is within quiet hours
 */
export function isQuietHours(preferences: UserPreferences): boolean {
  if (!preferences.sms.quietHours.enabled) {
    return false
  }

  const { start, end, timezone } = preferences.sms.quietHours
  
  try {
    // Get current time in user's timezone
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    const currentTime = formatter.format(now)
    
    // Parse times to compare
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    const [currHour, currMin] = currentTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const currentMinutes = currHour * 60 + currMin
    
    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes
    }
    
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  } catch (error) {
    console.error('[SMS] Error checking quiet hours:', error)
    return false // Default to allowing SMS if timezone check fails
  }
}

// ============================================================================
// SMS Sending (Stubbed)
// ============================================================================

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
  stubbed?: boolean
}

/**
 * Send SMS message via Amazon SNS
 * 
 * Currently stubbed - logs the message instead of sending.
 * When AWS_SNS_ENABLED=true and credentials are configured,
 * this will use the AWS SDK to send via SNS.
 */
export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<SMSResult> {
  const config = getSMSConfig()

  // Validate phone number
  const { valid, normalized, error } = normalizePhoneNumber(phoneNumber)
  if (!valid || !normalized) {
    return { success: false, error: error || 'Invalid phone number' }
  }

  // If not configured, stub the send
  if (!config.enabled || !config.accessKeyId) {
    console.log('[SMS STUB] Would send to', normalized)
    console.log('[SMS STUB] Message:', message)
    
    return {
      success: true,
      messageId: `stub-${Date.now()}`,
      stubbed: true
    }
  }

  // TODO: Implement actual AWS SNS send when ready
  // This will use @aws-sdk/client-sns
  //
  // import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
  //
  // const client = new SNSClient({
  //   region: config.region,
  //   credentials: {
  //     accessKeyId: config.accessKeyId,
  //     secretAccessKey: config.secretAccessKey!
  //   }
  // })
  //
  // const result = await client.send(new PublishCommand({
  //   PhoneNumber: normalized,
  //   Message: message,
  //   MessageAttributes: {
  //     'AWS.SNS.SMS.SMSType': {
  //       DataType: 'String',
  //       StringValue: 'Transactional'
  //     }
  //   }
  // }))
  //
  // return { success: true, messageId: result.MessageId }

  console.log('[SMS] SNS configured but SDK not yet integrated')
  return {
    success: true,
    messageId: `pending-${Date.now()}`,
    stubbed: true
  }
}

// ============================================================================
// Send Nudge via SMS
// ============================================================================

/**
 * Send a nudge via SMS
 */
export async function sendNudgeSMS(
  nudge: NudgeRecord,
  resolution: Resolution,
  preferences: UserPreferences
): Promise<SMSResult> {
  // Check if SMS is enabled
  if (!preferences.sms.enabled) {
    return { success: false, error: 'SMS not enabled' }
  }

  // Check if phone number is configured and verified
  if (!preferences.sms.phoneNumber) {
    return { success: false, error: 'No phone number configured' }
  }

  if (!preferences.sms.verified) {
    return { success: false, error: 'Phone number not verified' }
  }

  // Check quiet hours
  if (isQuietHours(preferences)) {
    return { success: false, error: 'Currently in quiet hours' }
  }

  // Generate message
  const message = generateSMSMessage(nudge.type, resolution)

  // Send
  return sendSMS(preferences.sms.phoneNumber, message)
}

// ============================================================================
// Verification (Stubbed)
// ============================================================================

/**
 * Send verification code to phone number
 */
export async function sendVerificationCode(phoneNumber: string): Promise<SMSResult> {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const message = `Your dailyBrief verification code is: ${code}`
  
  const result = await sendSMS(phoneNumber, message)
  
  if (result.success) {
    // In production, store the code in Redis with TTL
    console.log(`[SMS] Verification code for ${phoneNumber}: ${code}`)
    return { ...result, messageId: code } // Return code as messageId for stubbed testing
  }
  
  return result
}

/**
 * Verify code (stubbed - always returns true for now)
 */
export function verifyCode(submittedCode: string, expectedCode: string): boolean {
  // In production, compare against stored code from Redis
  return submittedCode === expectedCode
}
