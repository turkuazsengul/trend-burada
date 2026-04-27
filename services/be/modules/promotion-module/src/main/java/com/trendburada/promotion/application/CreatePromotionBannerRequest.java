package com.trendburada.promotion.application;

public record CreatePromotionBannerRequest(
        String title,
        String description,
        String imageUrl,
        String targetUrl,
        String blockType,
        int sortOrder
) {
}
