import { stubGetTicketStatus } from '../stubs/salesforce.js'

/**
 * Get ticket status and SLA ETA (conversational status check).
 */
export async function ticketStatusHandler(req, res) {
  try {
    const { ticketId } = req.params
    const status = await stubGetTicketStatus(ticketId)
    res.json(status)
  } catch (err) {
    console.error('status error', err)
    res.status(500).json({ error: err.message || 'Status check failed' })
  }
}
