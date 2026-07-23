/**
 * Tool definitions for the agent. The LLM can call these to trigger UI templates.
 */
export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'show_ticket_draft',
      description: 'Show the ticket creation form with pre-filled fields from the conversation. Use when the user wants to create a support ticket or after you have gathered enough context.',
      parameters: {
        type: 'object',
        properties: {
          tier1: { type: 'string', description: 'Primary topic (Tier 1), e.g. Managed Databases, Billing' },
          tier2: { type: 'string', description: 'Sub-topic (Tier 2), e.g. Performance, Billing' },
          tier3: { type: 'string', description: 'Tertiary topic (Tier 3), e.g. Connection' },
          issue: { type: 'string', description: 'Short issue summary' },
          resource: { type: 'string', description: 'Affected resource if known, e.g. db-postgres' },
          conversationPoints: {
            type: 'array',
            items: { type: 'string' },
            description: 'Bullet points summarizing the conversation for the ticket'
          }
        },
        required: ['tier1', 'tier2', 'tier3', 'issue', 'conversationPoints']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'show_rating_prompt',
      description: 'Show the star rating and feedback form after a ticket has been created. Use when the user has just submitted a ticket and you want to ask for feedback.',
      parameters: {
        type: 'object',
        properties: {
          ticketNumber: { type: 'string', description: 'The ticket number that was just created' }
        },
        required: ['ticketNumber']
      }
    }
  }
]

const CLARIFICATION_LIMIT = 5

export function toolCallToTemplate (toolCall) {
  const name = toolCall?.function?.name
  const raw = toolCall?.function?.arguments
  if (!name || !raw) return null
  let args
  try {
    args = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
  if (name === 'show_ticket_draft') {
    const conversationPoints = Array.isArray(args.conversationPoints) ? args.conversationPoints : []
    return {
      template: 'ticket_draft',
      templateData: {
        ticketDraft: {
          tier1: args.tier1 || 'Other',
          tier2: args.tier2 || 'Other',
          tier3: args.tier3 || 'Other',
          issue: args.issue || 'Support request',
          resource: args.resource || '',
          conversationPoints,
          clarificationCount: 0,
          clarificationLimit: CLARIFICATION_LIMIT
        }
      }
    }
  }
  if (name === 'show_rating_prompt') {
    return {
      template: 'rating',
      templateData: {
        ticketNumber: args.ticketNumber || ''
      }
    }
  }
  return null
}
