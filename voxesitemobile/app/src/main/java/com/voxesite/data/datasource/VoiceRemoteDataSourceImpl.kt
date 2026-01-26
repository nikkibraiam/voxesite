package com.voxesite.data.datasource

import com.voxesite.data.mapper.toDomain
import com.voxesite.data.network.ApiService
import com.voxesite.domain.model.AudioInput
import com.voxesite.domain.model.TextResponse
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class VoiceRemoteDataSourceImpl(
    private val api: ApiService
) : VoiceRemoteDataSource {


    override suspend fun transcribe(audio: AudioInput): TextResponse {
        val requestFile = audio.audioBytes.toRequestBody("audio/wav".toMediaType())


        val audioPart = MultipartBody.Part.createFormData(
            name = "audio",
            filename = "chunk_${audio.position}.wav",
            body = requestFile
        )


        return api.transcribe(
            audio = audioPart,
            groupId = audio.groupId.toRequestBody(),
            position = audio.position.toString().toRequestBody()
        ).toDomain()
    }
}