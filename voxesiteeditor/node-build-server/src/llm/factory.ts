import type { LLMAdapter } from './types'
import { OpenAIAdapter } from './openaiAdapter'
import { AnthropicAdapter } from './anthropicAdapter'

/**
 * Create the LLM adapter based on environment variables.
 *
 * Environment variables:
 *   LLM_PROVIDER  — 'openai' | 'ollama' | 'anthropic'  (default: 'openai')
 *   LLM_BASE_URL  — Base URL for OpenAI-compatible APIs (default: 'https://api.openai.com')
 *                   For Ollama use: 'http://localhost:11434'
 *   LLM_MODEL     — Model name (default varies by provider)
 *   LLM_API_KEY   — API key (leave empty for local Ollama)
 */
export function createLLMAdapter(): LLMAdapter {
  const provider = process.env.LLM_PROVIDER ?? 'openai'
  const apiKey = process.env.LLM_API_KEY ?? ''

  switch (provider) {
    case 'ollama':
      return new OpenAIAdapter(
        process.env.LLM_BASE_URL ?? 'http://localhost:11434',
        process.env.LLM_MODEL ?? 'llama3',
        '' // Ollama doesn't require an API key
      )

    case 'anthropic':
      return new AnthropicAdapter(
        process.env.LLM_MODEL ?? 'claude-sonnet-4-6',
        apiKey
      )

    case 'openai':
    default:
      return new OpenAIAdapter(
        process.env.LLM_BASE_URL ?? 'https://api.openai.com',
        process.env.LLM_MODEL ?? 'gpt-4o',
        apiKey
      )
  }
}
