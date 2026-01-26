package com.voxesite.core.audio

class AndroidAudioRecorder : AudioRecorder {

    override fun start(onChunk: (ByteArray) -> Unit) {
        // AudioRecord
        // bufferSize ~ 20–50ms
        // onChunk(buffer)
    }

    override fun stop() {
        // release AudioRecord
    }
}