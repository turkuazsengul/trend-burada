package com.trendburada.catalog.application;

public record UpdateProductRequest(
        String title,
        String category,
        String brand,
        String imageUrl,
        double oldPrice,
        int discountRate,
        double rating,
        int reviewCount,
        String color,
        String size,
        boolean freeCargo,
        double price,
        boolean fastDelivery,
        double sellerScore,
        String installmentText
) {
}
