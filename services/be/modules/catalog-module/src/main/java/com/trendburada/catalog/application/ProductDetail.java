package com.trendburada.catalog.application;

import java.util.List;

public record ProductDetail(
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
        String installmentText,
        List<String> sizeOptions,
        List<ProductColorOption> colorOptions,
        List<String> highlights,
        List<ProductAttribute> attributes
) {
}
