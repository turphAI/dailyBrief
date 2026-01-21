import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import type { ResearchSession, ResearchQuery, Resource } from '../types'

/**
 * Hook to manage research session with Redis backend
 * Falls back to localStorage if API is unavailable
 */
export function useSession(sessionId: string, defaultSession: ResearchSession) {
  const [session, setSession] = useState<ResearchSession>(defaultSession)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load session from API on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await axios.get(`/api/w3?action=sessions&sessionId=${sessionId}`)
        const loadedSession = response.data

        // Ensure arrays exist (migration safety)
        loadedSession.presentations = loadedSession.presentations || []
        loadedSession.threads = loadedSession.threads || []
        loadedSession.messages = loadedSession.messages || []

        setSession(loadedSession)

        // Cache in localStorage for offline access (read-only)
        localStorage.setItem(`deepResearch:session:${sessionId}`, JSON.stringify(loadedSession))

        setError(null)
      } catch (err) {
        console.error('Failed to load session from database:', err)

        // If session doesn't exist in database, create it
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setSession(defaultSession)
          setError(null)
        } else {
          // For other errors, show error but allow viewing cached data
          const stored = localStorage.getItem(`deepResearch:session:${sessionId}`)
          if (stored) {
            try {
              const cachedSession = JSON.parse(stored)
              cachedSession.presentations = cachedSession.presentations || []
              cachedSession.threads = cachedSession.threads || []
              cachedSession.messages = cachedSession.messages || []
              setSession(cachedSession)
              setError('⚠️ Database unavailable - viewing cached data (changes will not be saved)')
            } catch (e) {
              setSession(defaultSession)
              setError('⚠️ Database unavailable and no cached data')
            }
          } else {
            setSession(defaultSession)
            setError('⚠️ Database unavailable - cannot load session')
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [sessionId])

  // Save session to database (localStorage only as cache)
  const saveSession = useCallback(async (updatedSession: ResearchSession) => {
    // Optimistically update local state
    setSession(updatedSession)

    try {
      // Save to database first (source of truth)
      await axios.post('/api/w3?action=session', updatedSession)

      // Only cache in localStorage after successful database save
      localStorage.setItem(`deepResearch:session:${sessionId}`, JSON.stringify(updatedSession))

      setError(null)
    } catch (err) {
      console.error('Failed to save session to database:', err)

      // Revert optimistic update on failure
      setError('⚠️ Failed to save changes - database unavailable')

      // Don't update localStorage if database save failed
      throw err
    }
  }, [sessionId])

  // Update session (partial update)
  const updateSession = useCallback((updates: Partial<ResearchSession>) => {
    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    saveSession(updatedSession)
  }, [session, saveSession])

  // Add query to session
  const addQuery = useCallback(async (query: ResearchQuery) => {
    const updatedSession = {
      ...session,
      queries: [query, ...session.queries],
      updatedAt: new Date().toISOString()
    }
    await saveSession(updatedSession)
  }, [session, saveSession])

  // Add resource to session
  const addResource = useCallback(async (resource: Resource) => {
    const updatedSession = {
      ...session,
      resources: [...session.resources, resource],
      updatedAt: new Date().toISOString()
    }
    await saveSession(updatedSession)
  }, [session, saveSession])

  // Remove resource from session
  const removeResource = useCallback(async (resourceId: string) => {
    const updatedSession = {
      ...session,
      resources: session.resources.filter(r => r.id !== resourceId),
      updatedAt: new Date().toISOString()
    }
    await saveSession(updatedSession)
  }, [session, saveSession])

  // Update resource in session
  const updateResource = useCallback(async (resourceId: string, updates: Partial<Resource>) => {
    const updatedSession = {
      ...session,
      resources: session.resources.map(r =>
        r.id === resourceId ? { ...r, ...updates } : r
      ),
      updatedAt: new Date().toISOString()
    }
    await saveSession(updatedSession)
  }, [session, saveSession])

  return {
    session,
    loading,
    error,
    updateSession,
    addQuery,
    addResource,
    removeResource,
    updateResource
  }
}
