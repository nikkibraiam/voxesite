package com.voxesite.core.audio

interface AudioRecorder {
    fun start(onChunk: (ByteArray) -> Unit)
    fun stop()
}