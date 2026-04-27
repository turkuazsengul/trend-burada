package com.trendburada.promotion.application;

public record HomepageContentBlock(
        String id,
        String title,
        String description,
        String imageUrl,
        String targetUrl,
        int sortOrder
) {
}
