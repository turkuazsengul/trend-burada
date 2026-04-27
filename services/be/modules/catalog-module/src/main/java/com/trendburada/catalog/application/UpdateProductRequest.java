package com.trendburada.catalog.application;

import java.util.List;

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
        String installmentText,
        List<String> sizeOptions,
        List<ProductColorOption> colorOptions,
        List<String> highlights,
        List<ProductAttribute> attributes
) {
}
