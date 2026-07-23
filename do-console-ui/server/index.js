import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { chatHandler } from './handlers/chat.js'
import { submitTicketHandler } from './handlers/tickets.js'
import { appendToTicketHandler } from './handlers/append.js'
import { ticketStatusHandler } from './handlers/status.js'
import { submitFeedbackHandler } from './handlers/feedback.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'
const distPath = path.join(__dirname, '..', 'dist')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true }))
app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

app.post('/api/chat', chatHandler)
app.post('/api/tickets', upload.array('attachments', 5), submitTicketHandler)
app.post('/api/tickets/:ticketId/append', upload.array('attachments', 5), appendToTicketHandler)
app.get('/api/tickets/:ticketId/status', ticketStatusHandler)
app.post('/api/feedback', submitFeedbackHandler)

// In production, serve the React build and SPA fallback
if (isProduction) {
  app.use(express.static(distPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(isProduction
    ? `App running at http://localhost:${PORT}`
    : `Support Agent API at http://localhost:${PORT}`)
})
