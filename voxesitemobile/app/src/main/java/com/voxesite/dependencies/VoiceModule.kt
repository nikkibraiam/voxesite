package com.voxesite.dependencies

import com.voxesite.core.audio.AndroidAudioRecorder
import com.voxesite.core.audio.AudioRecorder
import com.voxesite.data.voice.VoiceSessionManager
import com.voxesite.data.repository.VoiceRepositoryImpl
import com.voxesite.domain.repository.VoiceRepository
import com.voxesite.domain.usecase.TranscribeTextFromVoiceUseCase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object VoiceModule {

    @Provides
    fun provideOkHttpClient(): OkHttpClient =
        OkHttpClient()

    @Provides
    fun provideVoiceSessionManager(
        client: OkHttpClient
    ): VoiceSessionManager =
        VoiceSessionManager(client, "ws://192.168.2.18:8000/ws/voice")

    @Provides
    fun provideVoiceRepository(
        sessionManager: VoiceSessionManager
    ): VoiceRepository =
        VoiceRepositoryImpl(sessionManager)

    @Provides
    fun provideTranscribeUseCase(
        repository: VoiceRepository
    ): TranscribeTextFromVoiceUseCase =
        TranscribeTextFromVoiceUseCase(repository)

    @Provides
    @Singleton
    fun provideAudioRecorder(): AudioRecorder =
        AndroidAudioRecorder()
}