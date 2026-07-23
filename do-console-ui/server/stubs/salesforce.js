/**
 * Stub: Salesforce ticket creation.
 * Set SALESFORCE_STUB_FAIL=1 to simulate failure for testing.
 */
export async function stubCreateTicket(payload, files) {
  if (process.env.SALESFORCE_STUB_FAIL === '1') {
    throw new Error('Simulated Salesforce API failure')
  }
  return {
    ticketNumber: `DO-${Date.now().toString(36).toUpperCase()}`,
    slaEta: 'Within 24 hours (business hours)'
  }
}

export async function stubAppendToTicket(ticketId, { message, conversationSummary, attachments }) {
  return { success: true }
}

export async function stubGetTicketStatus(ticketId) {
  return {
    ticketNumber: ticketId,
    status: 'In Progress',
    slaEta: 'Within 24 hours (business hours)'
  }
}
