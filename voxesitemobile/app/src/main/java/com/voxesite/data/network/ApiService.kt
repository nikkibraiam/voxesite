package com.voxesite.data.network

import com.voxesite.data.network.dto.TextResponseDto
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part


interface ApiService {

    @Multipart
    @POST("api/voice/transcribe")
    suspend fun transcribe(
        @Part audio: MultipartBody.Part,
        @Part("groupId") groupId: RequestBody,
        @Part("position") position: RequestBody
    ): TextResponseDto

}