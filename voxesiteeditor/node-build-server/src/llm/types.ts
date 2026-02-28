export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
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
