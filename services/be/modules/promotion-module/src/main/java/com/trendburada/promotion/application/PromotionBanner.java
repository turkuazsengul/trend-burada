package com.trendburada.promotion.application;

public record PromotionBanner(
        String id,
        String title,
        String description,
        String imageUrl,
        String targetUrl,
        String blockType,
        int sortOrder
) {
}
