import { runAgent } from '../agent/run.js'

/**
 * DO.Assistant / Support Agent.
 * Uses system prompt + knowledge base and returns reply + optional UI template (ticket_draft, rating).
 */
export async function chatHandler (req, res) {
  try {
    const { messages = [], pdocsSuggestionCount = 0, viewedDocIds = [] } = req.body || {}
    const result = await runAgent({ messages, pdocsSuggestionCount, viewedDocIds })
    res.json(result)
  } catch (err) {
    console.error('chat error', err)
    res.status(500).json({
      error: 'Chat failed',
      reply: 'Sorry, I could not process that. Please try again.'
    })
  }
}
