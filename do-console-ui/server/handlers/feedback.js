import { saveFeedback } from '../lib/feedbackLog.js'

/**
 * Record feedback (star rating + comment) for agent-generated ticket.
 */
export async function submitFeedbackHandler(req, res) {
  try {
    const { ticketNumber, agentId, rating, comment } = req.body || {}
    await saveFeedback({ ticketNumber, agentId: agentId || 'support_agent', rating, comment })
    res.json({ success: true })
  } catch (err) {
    console.error('feedback error', err)
    res.status(500).json({ error: err.message || 'Feedback failed' })
  }
}
