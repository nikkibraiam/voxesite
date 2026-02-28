import type { LLMAdapter, LLMMessage } from './types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

/**
 * Anthropic Messages API adapter.
 * Separates system messages from conversation messages as required by the API.
 * Streaming uses Anthropic's SSE format (content_block_delta events).
 *
 * Requires Node 18+ for native fetch support.
 */
export class AnthropicAdapter implements LLMAdapter {
  private model: string
  private apiKey: string

  constructor(model: string, apiKey: string) {
    this.model = model
    this.apiKey = apiKey
  }

  async chat(messages: LLMMessage[]): Promise<string> {
    const { system, conversation } = splitMessages(messages)

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 8192,
        messages: conversation,
        ...(system ? { system } : {})
      })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${text}`)
    }

    const data = await response.json() as any
    return data.content?.[0]?.text ?? ''
  }

  async chatStream(messages: LLMMessage[], onToken: (token: string) => void): Promise<string> {
    const { system, conversation } = splitMessages(messages)

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 8192,
        messages: conversation,
        ...(system ? { system } : {}),
        stream: true
      })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${text}`)
    }

    if (!response.body) throw new Error('No response body for streaming')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        try {
          const parsed = JSON.parse(trimmed.slice(6)) as any
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            const token = parsed.delta.text
            accumulated += token
            onToken(token)
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    return accumulated
  }
}

function splitMessages(messages: LLMMessage[]): {
  system: string
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>
} {
  const systemParts = messages.filter(m => m.role === 'system').map(m => m.content)
  const conversation = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  return { system: systemParts.join('\n'), conversation }
}
