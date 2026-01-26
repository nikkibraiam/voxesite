package com.voxesite.domain.repository
import com.voxesite.domain.model.AudioInput
import com.voxesite.domain.model.TextResponse
import kotlinx.coroutines.flow.Flow

interface VoiceRepository {

    fun startSession()
    fun sendAudio(chunk: ByteArray)
    fun stopSession()


    val textFlow: Flow<TextResponse>
}