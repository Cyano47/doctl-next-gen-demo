import { stubAppendToTicket } from '../stubs/salesforce.js'

/**
 * Append content or attachments to an existing ticket.
 */
export async function appendToTicketHandler(req, res) {
  try {
    const { ticketId } = req.params
    const { message, conversationSummary } = req.body || {}
    const attachments = req.files || []
    await stubAppendToTicket(ticketId, { message, conversationSummary, attachments })
    res.json({ success: true })
  } catch (err) {
    console.error('append ticket error', err)
    res.status(500).json({ error: err.message || 'Append failed' })
  }
}
