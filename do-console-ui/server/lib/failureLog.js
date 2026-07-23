/**
 * Log ticket creation failures to designated data table.
 * Stub: writes to console; real impl writes to DB/table.
 */
export async function logTicketFailure({ payload, error, attempt }) {
  console.error('[TICKET_FAILURE]', {
    at: new Date().toISOString(),
    attempt,
    error,
    payloadKeys: Object.keys(payload || {})
  })
}
