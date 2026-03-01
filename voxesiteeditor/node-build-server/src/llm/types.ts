/** An optional image attachment on a user message (for vision-capable models). */
export interface LLMImageInput {
  /** Raw base64-encoded image data (no data URI prefix). */
  data: string
  /** MIME type, e.g. 'image/png', 'image/jpeg', 'image/webp'. */
  mimeType: string
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  /** Optional image attached to this message. Only honoured for 'user' messages. */
  image?: LLMImageInput
}

export interface LLMAdapter {
  /**
   * Non-streaming chat. Returns the full response text.
   */
  chat(messages: LLMMessage[]): Promise<string>

  /**
   * Streaming chat. Calls onToken for each streamed token.
   * Resolves with the complete accumulated text when done.
   */
  chatStream(messages: LLMMessage[], onToken: (token: string) => void): Promise<string>
}
