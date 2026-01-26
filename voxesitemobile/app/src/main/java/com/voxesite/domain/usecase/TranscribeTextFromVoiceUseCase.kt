package com.voxesite.domain.usecase

import com.voxesite.domain.model.TextResponse
import com.voxesite.domain.repository.VoiceRepository
import kotlinx.coroutines.flow.Flow

class TranscribeTextFromVoiceUseCase (private val repository: VoiceRepository){

    fun start() = repository.startSession()


    fun sendAudio(chunk: ByteArray) =
        repository.sendAudio(chunk)


    fun stop() = repository.stopSession()


    val textFlow: Flow<TextResponse> =
        repository.textFlow

}