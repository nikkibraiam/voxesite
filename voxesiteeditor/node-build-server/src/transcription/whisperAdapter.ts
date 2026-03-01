/**
 * Transcription adapter interface + implementations.
 *
 * Follows the same adapter pattern as LLMAdapter:
 *   - WhisperAdapter   → calls a local Whisper-compatible HTTP server
 *   - MockWhisperAdapter → streams fake tokens for development (no Whisper required)
 *   - createTranscriptionAdapter() → picks implementation from WHISPER_BASE_URL env var
 */

// ─── Interface ────────────────────────────────────────────────────────────────

export interface TranscriptionAdapter {
  /**
   * Transcribe an audio buffer.
   * Returns an AsyncIterable of text tokens streamed as they become available.
   *
   * @param audioBuffer  Raw audio bytes (e.g. concatenated WebM/Opus chunks)
   * @param mimeType     MIME type of the audio (default: 'audio/webm')
   */
  transcribe(audioBuffer: Buffer, mimeType?: string): AsyncIterable<string>
}

// ─── WhisperAdapter ───────────────────────────────────────────────────────────

/**
 * Calls a local Whisper-compatible HTTP server.
 *
 * Expected endpoint: POST {WHISPER_BASE_URL}/asr
 *   - Body: multipart/form-data with field `audio_file`
 *   - Response: JSON `{ text: "..." }` (faster-whisper / whisper.cpp style)
 *
 * Compatible servers: whisper.cpp server, faster-whisper HTTP, openai/whisper flask wrappers.
 */
export class WhisperAdapter implements TranscriptionAdapter {
  constructor(private readonly baseUrl: string) {}

  async *transcribe(audioBuffer: Buffer, mimeType = 'audio/webm'): AsyncIterable<string> {
    const formData = new FormData()
    const blob = new Blob([audioBuffer as any], { type: mimeType })
    formData.append('audio_file', blob, 'audio.webm')

    const response = await fetch(`${this.baseUrl}/asr?output=json`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Whisper ASR responded with HTTP ${response.status}`)
    }

    const raw = await response.text()

    let transcript: string
    try {
      const json = JSON.parse(raw)
      // faster-whisper returns { text: "..." }; openai/whisper returns { text: "..." } too
      transcript = json.text ?? json.transcription ?? raw
    } catch {
      // Plain text response — use as-is
      transcript = raw
    }

    // Yield word-by-word for streaming effect on the client
    const words = transcript.trim().split(/\s+/)
    for (const word of words) {
      yield word + ' '
    }
  }
}

// ─── MockWhisperAdapter ───────────────────────────────────────────────────────

/**
 * Development-only mock that streams a fake transcript without any server.
 * Used automatically when WHISPER_BASE_URL is not set.
 */
export class MockWhisperAdapter implements TranscriptionAdapter {
  async *transcribe(_audioBuffer: Buffer, _mimeType?: string): AsyncIterable<string> {
    const words = [
      'Transcripción',
      'de',
      'prueba',
      '—',
      'configura',
      'WHISPER_BASE_URL',
      'para',
      'usar',
      'un',
      'servidor',
      'Whisper',
      'real.'
    ]
    for (const word of words) {
      await new Promise<void>((resolve) => setTimeout(resolve, 80))
      yield word + ' '
    }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Returns the correct TranscriptionAdapter based on environment configuration.
 *
 * Env vars:
 *   WHISPER_BASE_URL  URL of the local Whisper HTTP server (e.g. http://localhost:9000)
 *                     If not set, the mock adapter is used for development.
 */
export function createTranscriptionAdapter(): TranscriptionAdapter {
  const baseUrl = process.env.WHISPER_BASE_URL
  if (!baseUrl) {
    console.warn(
      '[Transcription] WHISPER_BASE_URL not set — using MockWhisperAdapter (fake transcript).'
    )
    return new MockWhisperAdapter()
  }
  return new WhisperAdapter(baseUrl)
}
