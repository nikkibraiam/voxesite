package com.voxesite.domain.model

data class TextResponse(
    val groupId: String,
    val position: Int,
    val text: String,
    val chunkTokens: Int,
    val totalTokens: Int,
    val totalBundle: Int,
    val isFinal: Boolean
)