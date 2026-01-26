package com.voxesite.data.repository

import com.voxesite.data.datasource.VoiceRemoteDataSource
import com.voxesite.domain.model.AudioInput
import com.voxesite.domain.model.TextResponse
import com.voxesite.domain.repository.VoiceRepository
import kotlinx.coroutines.flow.Flow

class VoiceRepositoryImpl {

    class VoiceRepositoryImpl(
        private val remoteDataSource: VoiceRemoteDataSource
    ) : VoiceRepository {


        override suspend fun streamText(audio: AudioInput): TextResponse {
            return remoteDataSource.transcribe(audio)
        }
    }

}