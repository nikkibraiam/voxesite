package com.voxesite.features.render.voice

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.voxesite.core.audio.AudioRecorder
import com.voxesite.domain.usecase.TranscribeTextFromVoiceUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class VoiceInputViewModel @Inject constructor(
    private val useCase: TranscribeTextFromVoiceUseCase,
    private val audioRecorder: AudioRecorder
) : ViewModel() {


    private val _uiText = MutableStateFlow("")
    val uiText: StateFlow<String> = _uiText


    init {
        viewModelScope.launch {
            useCase.textFlow.collect {
                _uiText.value += " " + it.text
            }
        }
    }


    fun onMicPressed() {
        useCase.start()
        audioRecorder.start { chunk ->
            useCase.sendAudio(chunk)
        }
    }


    fun onMicReleased() {
        audioRecorder.stop()
        useCase.stop()
    }
}