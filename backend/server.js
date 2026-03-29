import dotenv from 'dotenv'
dotenv.config()   // must be first — loads .env before anything else runs

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import resumeRoutes from './src/routes/resume.js'
import { errorHandler } from './src/middleware/errorHandler.js'
import roadmapRoutes from './src/routes/roadmap.js'

const app = express()
// --- middleware ---
// allow requests from your React dev server
app.use(cors({ origin: 'http://localhost:5173' }))

// parse incoming JSON bodies so req.body works
app.use(express.json())

// parse URL-encoded form data
app.use(express.urlencoded({ extended: true }))
app.use('/api/roadmap', roadmapRoutes)
// --- routes ---
// health check — always useful to verify server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.use('/api/resume', resumeRoutes)

// --- 404 handler ---
// catches any request that didn't match a route above
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// --- error handler — always last ---
app.use(errorHandler)

// --- connect to MongoDB then start server ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    })
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)   // crash loudly rather than run in a broken state
  })