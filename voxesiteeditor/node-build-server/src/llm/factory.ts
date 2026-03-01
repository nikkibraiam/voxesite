import type { LLMAdapter } from './types'
import { OpenAIAdapter } from './openaiAdapter'
import { AnthropicAdapter } from './anthropicAdapter'

/**
 * Ollama model names known to support vision (image input).
 * Updated as new vision-capable models are released.
 */
const OLLAMA_VISION_MODELS = ['llava', 'moondream', 'bakllava', 'llava-llama3', 'llava-phi3']

/**
 * Returns true if the currently configured LLM is able to process image inputs.
 *
 * - Anthropic: all Claude models support vision.
 * - OpenAI: gpt-4o and gpt-4-vision-preview support vision.
 * - Ollama: only explicit vision models (llava, moondream, bakllava, etc.).
 */
export function isVisionCapable(): boolean {
  const provider = process.env.LLM_PROVIDER ?? 'openai'
  const model = (process.env.LLM_MODEL ?? '').toLowerCase()

  if (provider === 'anthropic') return true

  if (provider === 'openai') {
    return model.includes('4o') || model.includes('vision') || model.includes('gpt-4-turbo')
  }

  if (provider === 'ollama') {
    return OLLAMA_VISION_MODELS.some(m => model.includes(m))
  }

  return false
}

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
