import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Migrate old single-session localStorage to new multi-session format
function migrateOldSession() {
  const oldKey = 'deepResearch:session'
  const oldSession = localStorage.getItem(oldKey)

  if (oldSession) {
    try {
      const session = JSON.parse(oldSession)
      const newKey = `deepResearch:session:${session.id || 'default'}`

      // Only migrate if new key doesn't exist (avoid overwriting)
      if (!localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldSession)
        console.log(`[Migration] Migrated session to ${newKey}`)
      }

      // Remove old key
      localStorage.removeItem(oldKey)
    } catch (e) {
      console.error('[Migration] Failed to migrate session:', e)
    }
  }
}

// Run migration once on app load
migrateOldSession()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
