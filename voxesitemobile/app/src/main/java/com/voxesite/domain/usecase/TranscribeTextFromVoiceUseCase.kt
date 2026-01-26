package com.voxesite.domain.usecase

import com.voxesite.domain.model.AudioInput
import com.voxesite.domain.model.TextResponse
import com.voxesite.domain.repository.VoiceRepository
import kotlinx.coroutines.flow.Flow

class TranscribeTextFromVoiceUseCase (private val repository: VoiceRepository){

    suspend operator fun invoke(audio: AudioInput): TextResponse {
        return repository.streamText(audio)
    }

}