import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PROMPT_PATH = join(__dirname, '..', 'prompts', 'support-agent.md')
const KNOWLEDGE_DIR = join(__dirname, '..', 'knowledge')
const KNOWLEDGE_CONFIG_PATH = join(__dirname, '..', 'config', 'knowledge.json')

/**
 * Load the system prompt from server/prompts/support-agent.md.
 * Replace this file with your complete agent prompt.
 */
export function loadSystemPrompt () {
  try {
    if (existsSync(PROMPT_PATH)) {
      return readFileSync(PROMPT_PATH, 'utf-8').trim()
    }
  } catch (e) {
    console.warn('Could not load support-agent prompt:', e.message)
  }
  return `You are the DO Support Agent. Help users with documentation and support tickets. When they want to create a ticket, use the show_ticket_draft tool.`
}

/**
 * Load knowledge base content from server/knowledge/*.md and *.txt,
 * and optionally from paths/URLs listed in server/config/knowledge.json.
 * Returns a single string to inject into the system message.
 */
export function loadKnowledgeBase () {
  const parts = []

  // From knowledge directory
  try {
    if (existsSync(KNOWLEDGE_DIR)) {
      const files = readdirSync(KNOWLEDGE_DIR)
      for (const name of files) {
        if (!/\.(md|txt)$/i.test(name)) continue
        const path = join(KNOWLEDGE_DIR, name)
        try {
          const content = readFileSync(path, 'utf-8').trim()
          parts.push(`## ${name}\n\n${content}`)
        } catch (e) {
          console.warn('Could not read knowledge file:', name, e.message)
        }
      }
    }
  } catch (e) {
    console.warn('Could not read knowledge dir:', e.message)
  }

  // From config (paths relative to project root or URLs - URLs need fetch, skip for now)
  try {
    if (existsSync(KNOWLEDGE_CONFIG_PATH)) {
      const config = JSON.parse(readFileSync(KNOWLEDGE_CONFIG_PATH, 'utf-8'))
      const paths = config.paths || config.files || []
      const root = join(__dirname, '..', '..')
      for (const p of paths) {
        const full = p.startsWith('/') ? p : join(root, p)
        if (existsSync(full)) {
          try {
            const content = readFileSync(full, 'utf-8').trim()
            parts.push(`## ${p}\n\n${content}`)
          } catch (e) {
            console.warn('Could not read knowledge path:', p, e.message)
          }
        }
      }
    }
  } catch (e) {
    // no config or invalid JSON
  }

  if (parts.length === 0) return ''
  return '\n\n---\n\n# Knowledge base\n\n' + parts.join('\n\n---\n\n')
}

let cachedPrompt = null
let cachedKnowledge = null

export function getSystemMessage () {
  if (cachedPrompt === null) cachedPrompt = loadSystemPrompt()
  if (cachedKnowledge === null) cachedKnowledge = loadKnowledgeBase()
  const knowledge = cachedKnowledge
    ? cachedKnowledge
    : 'No additional knowledge base files are loaded. You can add .md or .txt files in server/knowledge/ or configure server/config/knowledge.json.'
  return cachedPrompt + '\n\n' + knowledge
}
