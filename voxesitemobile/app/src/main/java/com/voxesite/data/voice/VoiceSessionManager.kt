package com.voxesite.data.voice

import com.google.gson.Gson
import com.voxesite.data.mapper.toDomain
import com.voxesite.data.network.dto.TextResponseDto
import com.voxesite.domain.model.TextResponse
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString

class VoiceSessionManager(
    private val client: OkHttpClient,
    private val url: String
) {

    private val gson = Gson()
    private var webSocket: WebSocket? = null

    private val _textFlow = MutableSharedFlow<TextResponse>(
        extraBufferCapacity = 64
    )

    val textFlow: Flow<TextResponse> = _textFlow

    fun startSession() {
        if (webSocket != null) return // ya existe

        val request = Request.Builder()
            .url(url)
            .build()

        webSocket = client.newWebSocket(
            request,
            object : WebSocketListener() {

                override fun onOpen(ws: WebSocket, response: Response) {
                    // opcional: metadata inicial
                    ws.send("""{"type":"start","sample_rate":16000}""")
                }

                override fun onMessage(ws: WebSocket, text: String) {
                    val dto = parseTextResponse(text)
                    _textFlow.tryEmit(dto)
                }

                override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                    stopSession()
                }

                override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                    webSocket = null
                }
            }
        )
    }

    fun sendAudio(chunk: ByteArray) {
        webSocket?.send(ByteString.of(*chunk))
    }

    fun stopSession() {
        webSocket?.send("""{"type":"end"}""")
        webSocket?.close(1000, "Voice finished")
        webSocket = null
    }

    private fun parseTextResponse(json: String): TextResponse {
        val dto = gson.fromJson(json, TextResponseDto::class.java)
        return dto.toDomain()
    }
}