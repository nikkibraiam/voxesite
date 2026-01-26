package com.voxesite.domain.model

data class AudioInput(
    val groupId: String,
    val position: Int,
    val audioBytes: ByteArray,
    val duration: Float,
    val totalDuration: Float,
    val totalBundle: Int
)