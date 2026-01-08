import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import resolutionRoutes from './routes/resolutions.js'
import chatRoutes from './routes/chat.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/resolutions', resolutionRoutes)
app.use('/api/chat', chatRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 API available at http://localhost:${PORT}/api`)
  console.log(`💬 Chat interface at http://localhost:${PORT}/api/chat`)
})

