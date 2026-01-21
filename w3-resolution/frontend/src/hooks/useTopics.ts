import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import type { ResearchSession } from '../types'

interface UseTopicsReturn {
  topics: ResearchSession[]
  loading: boolean
  error: string | null
  createTopic: (topic: Omit<ResearchSession, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  deleteTopic: (topicId: string) => Promise<void>
  updateTopicMetadata: (topicId: string, updates: Partial<Pick<ResearchSession, 'topic' | 'description'>>) => Promise<void>
  refreshTopics: () => Promise<void>
}

export function useTopics(): UseTopicsReturn {
  const [topics, setTopics] = useState<ResearchSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all topics from API
  const loadAllTopics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get('/api/w3?action=sessions')

      // Response is an array of sessions
      const sessionsList = Array.isArray(response.data) ? response.data : []

      // Sort by most recent first
      const sortedSessions = sessionsList.sort((a: ResearchSession, b: ResearchSession) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )

      setTopics(sortedSessions)
    } catch (err) {
      console.error('[useTopics] Failed to load topics:', err)

      // Fallback: Try to load from localStorage
      const localTopics = loadTopicsFromLocalStorage()
      if (localTopics.length > 0) {
        setTopics(localTopics)
        setError('Using offline mode - topics loaded from local storage')
      } else {
        setError('Failed to load topics')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Load topics from localStorage as fallback
  const loadTopicsFromLocalStorage = (): ResearchSession[] => {
    const sessions: ResearchSession[] = []

    // Scan all localStorage keys for session pattern
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('deepResearch:session:')) {
        try {
          const sessionData = localStorage.getItem(key)
          if (sessionData) {
            const session = JSON.parse(sessionData)
            sessions.push(session)
          }
        } catch (e) {
          console.error(`[useTopics] Failed to parse session from ${key}:`, e)
        }
      }
    }

    // Sort by most recent
    return sessions.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

  // Create new topic
  const createTopic = useCallback(async (
    topicData: Omit<ResearchSession, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    // Generate unique ID
    const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
    const now = new Date().toISOString()

    const newSession: ResearchSession = {
      ...topicData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      queries: topicData.queries || [],
      resources: topicData.resources || [],
      presentations: topicData.presentations || []
    }

    try {
      // Save to API
      await axios.post('/api/w3?action=session', newSession)

      // Save to localStorage immediately
      localStorage.setItem(`deepResearch:session:${newId}`, JSON.stringify(newSession))

      // Update local state
      setTopics(prev => [newSession, ...prev])

      return newId
    } catch (err) {
      console.error('[useTopics] Failed to create topic:', err)

      // Still save locally even if API fails
      localStorage.setItem(`deepResearch:session:${newId}`, JSON.stringify(newSession))
      setTopics(prev => [newSession, ...prev])

      return newId
    }
  }, [])

  // Delete topic
  const deleteTopic = useCallback(async (topicId: string) => {
    try {
      // Delete from API
      await axios.delete(`/api/w3?action=session&sessionId=${topicId}`)

      // Remove from localStorage
      localStorage.removeItem(`deepResearch:session:${topicId}`)

      // Update local state
      setTopics(prev => prev.filter(t => t.id !== topicId))
    } catch (err) {
      console.error('[useTopics] Failed to delete topic:', err)

      // Still remove locally even if API fails
      localStorage.removeItem(`deepResearch:session:${topicId}`)
      setTopics(prev => prev.filter(t => t.id !== topicId))
    }
  }, [])

  // Update topic metadata (title, description)
  const updateTopicMetadata = useCallback(async (
    topicId: string,
    updates: Partial<Pick<ResearchSession, 'topic' | 'description'>>
  ) => {
    try {
      // Find existing topic
      const existingTopic = topics.find(t => t.id === topicId)
      if (!existingTopic) {
        throw new Error('Topic not found')
      }

      // Create updated session
      const updatedSession: ResearchSession = {
        ...existingTopic,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      // Save to API
      await axios.post('/api/w3?action=session', updatedSession)

      // Save to localStorage
      localStorage.setItem(`deepResearch:session:${topicId}`, JSON.stringify(updatedSession))

      // Update local state
      setTopics(prev =>
        prev.map(t => (t.id === topicId ? updatedSession : t))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      )
    } catch (err) {
      console.error('[useTopics] Failed to update topic metadata:', err)
      throw err
    }
  }, [topics])

  // Load topics on mount
  useEffect(() => {
    loadAllTopics()
  }, [loadAllTopics])

  return {
    topics,
    loading,
    error,
    createTopic,
    deleteTopic,
    updateTopicMetadata,
    refreshTopics: loadAllTopics
  }
}
