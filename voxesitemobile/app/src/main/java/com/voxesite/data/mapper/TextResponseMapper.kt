package com.voxesite.data.mapper

import com.voxesite.data.network.dto.TextResponseDto
import com.voxesite.domain.model.TextResponse

fun TextResponseDto.toDomain(): TextResponse {
    return TextResponse(
        groupId = groupId,
        position = position,
        text = text,
        chunkTokens = chunkTokens,
        totalTokens = totalTokens,
        totalBundle = totalBundle,
        isFinal = isFinal
    )
}