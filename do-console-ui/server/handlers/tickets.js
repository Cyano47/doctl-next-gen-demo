import { stubCreateTicket } from '../stubs/salesforce.js'
import { getTechnicalMetadata } from '../stubs/atlantis.js'
import { redactPii } from '../lib/redact.js'
import { logTicketFailure } from '../lib/failureLog.js'

const MAX_ATTEMPTS = 3

/**
 * Submit ticket to Salesforce (stub). Builds CST payload: clean transcript,
 * technical metadata, AI summary, categorization. Retries up to 3 times.
 */
function parseBody(body) {
  const b = body || {}
  let conversationPoints = b.conversationPoints
  if (typeof conversationPoints === 'string') {
    try {
      conversationPoints = JSON.parse(conversationPoints)
    } catch {
      conversationPoints = []
    }
  }
  conversationPoints = Array.isArray(conversationPoints) ? conversationPoints : []
  return {
    tier1: b.tier1 || 'Other',
    tier2: b.tier2 || 'Other',
    tier3: b.tier3 || 'Other',
    issue: b.issue || 'Support request',
    resource: b.resource || null,
    conversationSummary: b.conversationSummary || '',
    conversationPoints,
    aiSummary: b.aiSummary || b.issue || 'Support request'
  }
}

export async function submitTicketHandler(req, res) {
  try {
    const parsed = parseBody(req.body)
    const {
      tier1,
      tier2,
      tier3,
      issue,
      resource,
      conversationSummary,
      conversationPoints,
      aiSummary
    } = parsed

    let rawTranscript = req.body?.transcript
    if (typeof rawTranscript !== 'string') {
      rawTranscript = JSON.stringify(Array.isArray(rawTranscript) ? rawTranscript : [])
    }
    const cleanTranscript = redactPii(rawTranscript)
    const technicalMetadata = await getTechnicalMetadata(req)
    const attachments = (req.files || []).map(f => ({ name: f.originalname, size: f.size }))

    const payload = {
      tier1,
      tier2,
      tier3,
      issue,
      resource,
      conversationSummary: conversationSummary || conversationPoints.join('\n'),
      aiSummary: aiSummary || issue,
      cleanTranscript,
      technicalMetadata,
      attachments,
      source: 'support_agent'
    }

    let lastError
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const result = await stubCreateTicket(payload, req.files)
        return res.json({
          success: true,
          ticketNumber: result.ticketNumber,
          slaEta: result.slaEta
        })
      } catch (err) {
        lastError = err
        if (attempt === MAX_ATTEMPTS) {
          await logTicketFailure({
            payload: { ...payload, cleanTranscript: '[redacted]' },
            error: err.message,
            attempt
          })
          return res.status(502).json({
            success: false,
            error: 'Ticket creation failed after multiple attempts.',
            alternateLink: 'https://cloudsupport.digitalocean.com/s/'
          })
        }
      }
    }

    throw lastError
  } catch (err) {
    console.error('submit ticket error', err)
    res.status(500).json({
      success: false,
      error: err.message || 'Submission failed',
      alternateLink: 'https://cloudsupport.digitalocean.com/s/'
    })
  }
}
