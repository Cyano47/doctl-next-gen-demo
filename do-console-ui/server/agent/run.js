import OpenAI from 'openai'
import { getSystemMessage } from './loaders.js'
import { TOOLS, toolCallToTemplate } from './tools.js'

/**
 * Run the support agent: send messages to the LLM with system prompt + knowledge base,
 * and optional tools. Returns { reply, template, templateData } for the frontend.
 */
export async function runAgent ({ messages = [], pdocsSuggestionCount = 0, viewedDocIds = [] }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return runAgentStub({ messages, pdocsSuggestionCount })
  }

  const client = new OpenAI({ apiKey })
  const systemContent = getSystemMessage()

  const openaiMessages = [
    { role: 'system', content: systemContent },
    ...messages.map((m) => ({ role: m.role, content: m.content || '' }))
  ]

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: openaiMessages,
    tools: TOOLS.length ? TOOLS : undefined,
    tool_choice: TOOLS.length ? 'auto' : undefined
  })

  const choice = response.choices?.[0]
  const message = choice?.message
  let reply = message?.content?.trim() || 'I’m not sure how to respond. You can say "Create ticket" if you need support.'
  let template = null
  let templateData = null

  const toolCalls = message?.tool_calls
  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    const first = toolCallToTemplate(toolCalls[0])
    if (first) {
      template = first.template
      templateData = first.templateData
    }
  }

  return {
    reply,
    template,
    templateData,
    ticketDraft: template === 'ticket_draft' ? templateData?.ticketDraft : null,
    clarificationRemaining: templateData?.ticketDraft
      ? (templateData.ticketDraft.clarificationLimit ?? 5) - (templateData.ticketDraft.clarificationCount ?? 0)
      : null
  }
}

/**
 * Stub when OPENAI_API_KEY is not set. Keeps UI working with simple intent detection.
 */
function runAgentStub ({ messages = [], pdocsSuggestionCount = 0 }) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const lastContent = (lastUser?.content || '').toLowerCase()
  const ticketPhrases = [
    'open a ticket', 'create a ticket', 'need human help', 'raise support request',
    'create ticket', 'support ticket', 'talk to support', 'speak to agent'
  ]
  const showTicketDraft =
    ticketPhrases.some((p) => lastContent.includes(p)) || pdocsSuggestionCount >= 2

  const CLARIFICATION_LIMIT = 5
  const userTurns = messages.filter((m) => m.role === 'user').length
  const clarificationCount = showTicketDraft && userTurns > 1 ? Math.min(userTurns - 1, CLARIFICATION_LIMIT) : 0

  const reply = showTicketDraft
    ? "Sure, let me create a ticket. I've captured this from our conversation:"
    : "I'm here to help. Ask about documentation or say \"Create ticket\" if you need human support."

  const ticketDraft = showTicketDraft
    ? {
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
        clarificationCount,
        clarificationLimit: CLARIFICATION_LIMIT
      }
    : null

  return {
    reply,
    template: showTicketDraft ? 'ticket_draft' : null,
    templateData: showTicketDraft ? { ticketDraft } : null,
    ticketDraft,
    clarificationRemaining: ticketDraft ? CLARIFICATION_LIMIT - clarificationCount : null
  }
}
