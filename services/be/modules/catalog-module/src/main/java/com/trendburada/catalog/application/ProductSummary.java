package com.trendburada.catalog.application;

public record ProductSummary(
        String id,
        String productCode,
        String title,
        String category,
        String brand,
        String mark,
        String imageUrl,
        String img,
        double oldPrice,
        int discountRate,
        double rating,
        int reviewCount,
        String color,
        String size,
        boolean freeCargo,
        boolean isFreeCargo,
        double price,
        boolean fastDelivery,
        boolean isFastDelivery,
        double sellerScore,
        String installmentText
) {
}
