import type { LLMAdapter, LLMMessage } from './types'

/**
 * Converts an LLMMessage to the OpenAI API message shape.
 * When `message.image` is present the content becomes a multimodal array.
 */
function toOpenAIMessage(msg: LLMMessage): any {
  if (msg.image && msg.role === 'user') {
    return {
      role: msg.role,
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${msg.image.mimeType};base64,${msg.image.data}`
          }
        },
        { type: 'text', text: msg.content }
      ]
    }
  }
  return { role: msg.role, content: msg.content }
}

/**
 * OpenAI-compatible adapter.
 * Works with: OpenAI API, Ollama (LLM_BASE_URL=http://localhost:11434),
 * and any provider that implements the /v1/chat/completions endpoint.
 *
 * Requires Node 18+ for native fetch support.
 */
export class OpenAIAdapter implements LLMAdapter {
  private baseUrl: string
  private model: string
  private apiKey: string

  constructor(baseUrl: string, model: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.model = model
    this.apiKey = apiKey
  }

  async chat(messages: LLMMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify({ model: this.model, messages: messages.map(toOpenAIMessage), stream: false })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`OpenAI API error ${response.status}: ${text}`)
    }

    const data = await response.json() as any
    return data.choices?.[0]?.message?.content ?? ''
  }

  async chatStream(messages: LLMMessage[], onToken: (token: string) => void): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify({ model: this.model, messages: messages.map(toOpenAIMessage), stream: true })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`OpenAI API error ${response.status}: ${text}`)
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
        const data = trimmed.slice(6)
        if (data === '[DONE]') break
        try {
          const parsed = JSON.parse(data) as any
          const token = parsed.choices?.[0]?.delta?.content
          if (token) {
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
