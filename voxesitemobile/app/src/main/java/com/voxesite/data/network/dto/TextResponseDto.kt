package com.voxesite.data.network.dto

data class TextResponseDto(
    val groupId: String,
    val position: Int,
    val text: String,
    val chunkTokens: Int,
    val totalTokens: Int,
    val totalBundle: Int,
    val isFinal: Boolean
)