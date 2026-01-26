package com.voxesite.data.repository

import com.voxesite.data.voice.VoiceSessionManager
import com.voxesite.domain.model.TextResponse
import com.voxesite.domain.repository.VoiceRepository
import kotlinx.coroutines.flow.Flow

class VoiceRepositoryImpl(
    private val sessionManager: VoiceSessionManager
) : VoiceRepository {

    override fun startSession() =
        sessionManager.startSession()


    override fun sendAudio(chunk: ByteArray) =
        sessionManager.sendAudio(chunk)


    override fun stopSession() =
        sessionManager.stopSession()


    override val textFlow: Flow<TextResponse> =
        sessionManager.textFlow
}