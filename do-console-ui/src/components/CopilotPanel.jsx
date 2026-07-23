import { useState, useRef, useEffect } from 'react'

const INITIAL_MESSAGES = [
  { role: 'assistant', content: "Hi, I'm here to help. Ask about documentation or say \"Create ticket\" if you need human support." }
]

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

function DbIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  )
}

export default function CopilotPanel({ showAskDocsNudge = false, onDismissNudge }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [ticketDraft, setTicketDraft] = useState(null)
  const [ticketEditing, setTicketEditing] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitResult, setSubmitResult] = useState(null)
  const [showRatingPrompt, setShowRatingPrompt] = useState(false)
  const [ratingComment, setRatingComment] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [statusResult, setStatusResult] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [appendMessage, setAppendMessage] = useState('')
  const [appendFiles, setAppendFiles] = useState([])
  const [appendSubmitting, setAppendSubmitting] = useState(false)
  const [appendSuccess, setAppendSuccess] = useState(false)
  const fileInputRef = useRef(null)
  const appendFileInputRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages, ticketDraft])

  const updateDraft = (field, value) => {
    setTicketDraft((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const updateConversationPoint = (index, value) => {
    setTicketDraft((prev) => {
      if (!prev || !Array.isArray(prev.conversationPoints)) return prev
      const next = [...prev.conversationPoints]
      next[index] = value
      return { ...prev, conversationPoints: next }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = message.trim()
    if (!text || loading) return

    setMessage('')
    const userMsg = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content
      }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          pdocsSuggestionCount: 0,
          viewedDocIds: []
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chat failed')

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])

      // Drive UI templates from agent response (template + templateData or legacy ticketDraft)
      const draft = data.templateData?.ticketDraft ?? data.ticketDraft
      if (data.template === 'ticket_draft' || draft) {
        setTicketDraft(draft)
        setTicketEditing(false)
        setSubmitStatus('idle')
        setSubmitResult(null)
        setShowRatingPrompt(false)
      }
      if (data.template === 'rating' && data.templateData?.ticketNumber) {
        setShowRatingPrompt(true)
        setSubmitResult((prev) => ({
          ticketNumber: data.templateData.ticketNumber,
          slaEta: prev?.slaEta ?? ''
        }))
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: err.message || 'Something went wrong. Please try again.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    addFiles(files)
    e.target.value = ''
  }

  const addFiles = (files) => {
    let total = attachedFiles.reduce((s, f) => s + f.size, 0)
    const toAdd = []
    for (const f of files) {
      if (total + f.size > MAX_FILE_SIZE_BYTES) break
      toAdd.push(f)
      total += f.size
    }
    setAttachedFiles((prev) => [...prev, ...toAdd])
  }

  const removeFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitTicket = async () => {
    if (!ticketDraft || submitStatus === 'submitting') return

    setSubmitStatus('submitting')
    setSubmitResult(null)

    const formData = new FormData()
    formData.append('tier1', ticketDraft.tier1 || 'Other')
    formData.append('tier2', ticketDraft.tier2 || 'Other')
    formData.append('tier3', ticketDraft.tier3 || 'Other')
    formData.append('issue', ticketDraft.issue || '')
    formData.append('resource', ticketDraft.resource || '')
    formData.append('conversationSummary', (ticketDraft.conversationPoints || []).join('\n'))
    formData.append('conversationPoints', JSON.stringify(ticketDraft.conversationPoints || []))
    formData.append('aiSummary', ticketDraft.issue || '')
    formData.append('transcript', JSON.stringify(messages))
    attachedFiles.forEach((f) => formData.append('attachments', f))

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setSubmitStatus('success')
        setSubmitResult({ ticketNumber: data.ticketNumber, slaEta: data.slaEta })
        setTicketDraft(null)
        setAttachedFiles([])
        setShowRatingPrompt(true)
      } else {
        setSubmitStatus('error')
        setSubmitResult({
          error: data.error || 'Ticket creation failed',
          alternateLink: data.alternateLink || 'https://cloudsupport.digitalocean.com/s/'
        })
      }
    } catch (err) {
      setSubmitStatus('error')
      setSubmitResult({
        error: err.message || 'Submission failed',
        alternateLink: 'https://cloudsupport.digitalocean.com/s/'
      })
    }
  }

  const lastSubmittedTicketId = submitStatus === 'success' && submitResult?.ticketNumber ? submitResult.ticketNumber : null

  const handleCheckStatus = async () => {
    if (!lastSubmittedTicketId) return
    setStatusLoading(true)
    setStatusResult(null)
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(lastSubmittedTicketId)}/status`)
      const data = await res.json()
      if (res.ok) setStatusResult(data)
      else setStatusResult({ error: data.error || 'Failed to load status' })
    } catch (err) {
      setStatusResult({ error: err.message })
    } finally {
      setStatusLoading(false)
    }
  }

  const handleFeedbackSubmit = async (rating) => {
    if (!submitResult?.ticketNumber) return
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketNumber: submitResult.ticketNumber,
          agentId: 'support_agent',
          rating,
          comment: ratingComment.trim() || undefined
        })
      })
      setFeedbackSubmitted(true)
      setShowRatingPrompt(false)
    } catch (err) {
      console.error('Feedback submit failed', err)
    }
  }

  const handleAppendToTicket = async (e) => {
    e.preventDefault()
    if (!lastSubmittedTicketId || appendSubmitting) return
    const formData = new FormData()
    formData.append('message', appendMessage.trim() || '')
    appendFiles.forEach((f) => formData.append('attachments', f))
    setAppendSubmitting(true)
    setAppendSuccess(false)
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(lastSubmittedTicketId)}/append`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAppendSuccess(true)
        setAppendMessage('')
        setAppendFiles([])
      }
    } finally {
      setAppendSubmitting(false)
    }
  }

  const lastAssistantContent = [...messages].reverse().find((m) => m.role === 'assistant')?.content

  return (
    <aside className="w-96 h-full min-h-0 flex flex-col border-l border-gray-200 bg-[#f8f9fa] overflow-hidden">
      <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-do-blue">Ask Docs</span>
          <button type="button" className="p-0.5 text-gray-400 hover:text-gray-600 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            In Preview
          </span>
        </div>
        <button type="button" className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-4">
        {showAskDocsNudge && (
          <div className="bg-blue-50 border border-do-blue/30 rounded-lg p-3 text-sm text-gray-700">
            <p className="font-medium text-do-blue">Get help faster</p>
            <p className="mt-0.5">Find answers in our documentation, or create a ticket if you need human support.</p>
            <button
              type="button"
              onClick={onDismissNudge}
              className="mt-2 text-xs text-do-blue hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={msg.role === 'user' ? 'flex justify-end' : ''}
          >
            <div
              className={
                msg.role === 'user'
                  ? 'max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-gray-200 text-gray-800 text-sm'
                  : 'text-sm text-gray-700'
              }
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-sm text-gray-500">Thinking...</div>
        )}

        {ticketDraft && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-panel">
            {(ticketDraft.clarificationLimit != null) && (
              <p className="text-xs text-gray-500 mb-3">
                Clarifications: {ticketDraft.clarificationCount ?? 0} of {ticketDraft.clarificationLimit} used
                {ticketDraft.clarificationLimit - (ticketDraft.clarificationCount ?? 0) > 0 &&
                  ` (${ticketDraft.clarificationLimit - (ticketDraft.clarificationCount ?? 0)} remaining)`}
              </p>
            )}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ticket Creation
              </h3>
              <button
                type="button"
                onClick={() => setTicketEditing(!ticketEditing)}
                className="text-sm text-do-blue hover:underline flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {ticketEditing ? 'Done' : 'Edit'}
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Primary Topic (Tier 1)</div>
                {ticketEditing ? (
                  <input
                    value={ticketDraft.tier1 || ''}
                    onChange={(e) => updateDraft('tier1', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-gray-900"
                  />
                ) : (
                  <div className="text-gray-900">{ticketDraft.tier1 || '—'}</div>
                )}
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Sub-Topic (Tier 2)</div>
                {ticketEditing ? (
                  <input
                    value={ticketDraft.tier2 || ''}
                    onChange={(e) => updateDraft('tier2', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-gray-900"
                  />
                ) : (
                  <div className="text-gray-900">{ticketDraft.tier2 || '—'}</div>
                )}
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Tertiary Topic (Tier 3)</div>
                {ticketEditing ? (
                  <input
                    value={ticketDraft.tier3 || ''}
                    onChange={(e) => updateDraft('tier3', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-gray-900"
                  />
                ) : (
                  <div className="text-gray-900">{ticketDraft.tier3 || '—'}</div>
                )}
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Issue</div>
                {ticketEditing ? (
                  <input
                    value={ticketDraft.issue || ''}
                    onChange={(e) => updateDraft('issue', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-gray-900"
                  />
                ) : (
                  <div className="text-gray-900">{ticketDraft.issue || '—'}</div>
                )}
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Resource</div>
                {ticketEditing ? (
                  <input
                    value={ticketDraft.resource || ''}
                    onChange={(e) => updateDraft('resource', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-gray-900"
                  />
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-gray-700">
                    <DbIcon className="w-4 h-4 text-gray-500" />
                    {ticketDraft.resource || '—'}
                  </span>
                )}
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1.5">From our conversation</div>
                {ticketEditing && Array.isArray(ticketDraft.conversationPoints) ? (
                  <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                    {ticketDraft.conversationPoints.map((point, i) => (
                      <li key={i}>
                        <input
                          value={point}
                          onChange={(e) => updateConversationPoint(i, e.target.value)}
                          className="w-full max-w-[90%] px-2 py-0.5 border border-gray-200 rounded text-gray-900 text-sm"
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                    {(ticketDraft.conversationPoints || []).map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files || [])) }}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 border-2 border-dashed rounded-lg py-6 px-4 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-do-blue bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600">Drop your files here or browse</p>
              <p className="text-xs text-gray-400 mt-0.5">Max file size: {MAX_FILE_SIZE_MB}MB</p>
            </div>
            {attachedFiles.length > 0 && (
              <ul className="mt-2 text-xs text-gray-600 space-y-1">
                {attachedFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>{f.name}</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-do-blue hover:underline">Remove</button>
                  </li>
                ))}
              </ul>
            )}

            {submitStatus === 'error' && submitResult?.alternateLink && (
              <p className="mt-2 text-sm text-red-600">
                {submitResult.error}{' '}
                <a href={submitResult.alternateLink} target="_blank" rel="noopener noreferrer" className="text-do-blue underline">
                  Create ticket manually
                </a>
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmitTicket}
              disabled={submitStatus === 'submitting'}
              className="mt-4 w-full py-3 rounded-lg font-medium text-white bg-gradient-to-r from-do-blue to-blue-600 hover:from-do-blue-dark hover:to-blue-700 disabled:opacity-50 text-sm"
            >
              {submitStatus === 'submitting' ? 'Submitting...' : 'Submit ticket'}
            </button>
          </div>
        )}

        {submitStatus === 'success' && submitResult && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-gray-800">
              <p className="font-medium">Ticket created</p>
              <p>Ticket number: <strong>{submitResult.ticketNumber}</strong></p>
              <p>Expected response: {submitResult.slaEta}</p>
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={statusLoading}
                className="mt-2 text-sm text-do-blue hover:underline disabled:opacity-50"
              >
                {statusLoading ? 'Loading...' : 'Check status'}
              </button>
              {statusResult && !statusResult.error && (
                <div className="mt-2 pt-2 border-t border-green-200 text-gray-700">
                  <p>Status: {statusResult.status}</p>
                  <p>SLA ETA: {statusResult.slaEta}</p>
                </div>
              )}
              {statusResult?.error && (
                <p className="mt-2 text-red-600">{statusResult.error}</p>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-gray-700 mb-2">Add information to this ticket</p>
              <form onSubmit={handleAppendToTicket}>
                <textarea
                  value={appendMessage}
                  onChange={(e) => setAppendMessage(e.target.value)}
                  placeholder="Add logs, screenshots description, or clarifications..."
                  className="w-full px-3 py-2 border border-gray-200 rounded text-gray-900 text-sm resize-y min-h-[60px]"
                  rows={2}
                  disabled={appendSubmitting}
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    ref={appendFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => setAppendFiles(Array.from(e.target.files || []))}
                  />
                  <button
                    type="button"
                    onClick={() => appendFileInputRef.current?.click()}
                    className="text-sm text-do-blue hover:underline"
                  >
                    Attach files
                  </button>
                  {appendFiles.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {appendFiles.length} file(s) selected
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={appendSubmitting || (!appendMessage.trim() && appendFiles.length === 0)}
                  className="mt-2 px-3 py-1.5 bg-do-blue text-white text-sm rounded hover:bg-do-blue-dark disabled:opacity-50"
                >
                  {appendSubmitting ? 'Sending...' : 'Add to ticket'}
                </button>
                {appendSuccess && (
                  <p className="mt-2 text-green-600 text-xs">Added to ticket.</p>
                )}
              </form>
            </div>
          </div>
        )}

        {showRatingPrompt && !feedbackSubmitted && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
            <p className="text-gray-700 mb-2">How was your experience?</p>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 text-gray-400 hover:text-yellow-500 focus:outline-none"
                  aria-label={`${star} stars`}
                  onClick={() => handleFeedbackSubmit(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Optional: add a comment"
              className="w-full mt-2 px-3 py-2 border border-gray-200 rounded text-gray-900 text-sm resize-y min-h-[60px]"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">Feedback is stored for improvement.</p>
          </div>
        )}
        {feedbackSubmitted && (
          <div className="text-sm text-gray-600">Thanks for your feedback.</div>
        )}

        {lastAssistantContent && (
          <div className="flex items-center gap-3 text-gray-400">
            <button type="button" className="p-1 hover:text-gray-600" title="Copy">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button type="button" className="p-1 hover:text-gray-600" title="Good response">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>
            <button type="button" className="p-1 hover:text-gray-600" title="Bad response">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-4h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </button>
            <button type="button" className="p-1 hover:text-gray-600" title="Regenerate">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="shrink-0 p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can I help you?"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-do-blue/30 focus:border-do-blue"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="p-2.5 rounded-lg bg-do-blue text-white hover:bg-do-blue-dark disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-2 leading-tight">
          Powered by OpenAI GPT-4o. By using this copilot, you agree to share your data with it. Do not share sensitive information.
        </p>
      </div>
    </aside>
  )
}
