/**
 * Stub: DO.Assistant orchestration + Support Agent handoff.
 * Real implementation will call LLM + trigger logic + classification (Tier 1/2/3).
 */
const TICKET_INTENT_PHRASES = [
  'open a ticket', 'create a ticket', 'need human help', 'raise support request',
  'create ticket', 'support ticket', 'talk to support', 'speak to agent'
]

function hasTicketIntent (lastUserContent) {
  const lower = (lastUserContent || '').toLowerCase()
  return TICKET_INTENT_PHRASES.some(p => lower.includes(p))
}

const CLARIFICATION_LIMIT = 5

function buildTicketDraft (messages, clarificationCount = 0) {
  const summary = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .slice(-5)
    .join(' ')
  return {
    tier1: 'Managed Databases',
    tier2: 'Performance',
    tier3: 'Connection',
    issue: 'Database connection timeouts',
    resource: 'db-postgres',
    conversationPoints: [
      'Intermittent connection timeouts',
      'Connection pool settings verified',
      'Production impact - users seeing slow loads',
      'Unusual backend latency detected'
    ],
    clarificationCount: Math.min(clarificationCount, CLARIFICATION_LIMIT),
    clarificationLimit: CLARIFICATION_LIMIT
  }
}

export async function stubChat ({ messages = [], pdocsSuggestionCount = 0 }) {
  const lastUser = [...messages].reverse().find(m => m.role === 'user')
  const lastContent = lastUser?.content || ''
  const showTicketDraft = hasTicketIntent(lastContent) || pdocsSuggestionCount >= 2
  const userTurns = messages.filter(m => m.role === 'user').length
  const clarificationCount = showTicketDraft && userTurns > 1 ? Math.min(userTurns - 1, CLARIFICATION_LIMIT) : 0

  const reply = showTicketDraft
    ? "Sure, let me create a ticket. I've captured this from our conversation:"
    : "I'm here to help. You can ask about documentation or say \"Create ticket\" if you need human support."

  const ticketDraft = showTicketDraft ? buildTicketDraft(messages, clarificationCount) : null

  return {
    reply,
    ticketDraft,
    clarificationRemaining: ticketDraft ? CLARIFICATION_LIMIT - clarificationCount : null
  }
}
