package com.voxesite.data.datasource

import com.voxesite.domain.model.AudioInput
import com.voxesite.domain.model.TextResponse

interface VoiceRemoteDataSource {

    suspend fun transcribe(audio: AudioInput): TextResponse

}