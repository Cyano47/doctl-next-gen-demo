/**
 * PII redaction for clean transcript attached to ticket.
 */
export function redactPii(text) {
  if (!text || typeof text !== 'string') return ''
  let out = text
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  out = out.replace(emailRe, '[EMAIL_REDACTED]')
  const likelyToken = /\b[A-Za-z0-9_-]{20,}\b/g
  out = out.replace(likelyToken, (m) => (m.length > 32 ? '[TOKEN_REDACTED]' : m))
  return out
}
