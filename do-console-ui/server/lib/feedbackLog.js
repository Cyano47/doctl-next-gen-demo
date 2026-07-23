/**
 * Persist feedback (rating + comment) to dedicated data table.
 * Stub: logs; real impl writes to DB with ticket number and Agent ID.
 */
export async function saveFeedback({ ticketNumber, agentId, rating, comment }) {
  console.log('[FEEDBACK]', { ticketNumber, agentId, rating, comment: (comment || '').slice(0, 100) })
}
