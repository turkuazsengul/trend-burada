package com.trendburada.catalog.application;

public record CreateProductRequest(
        String title,
        String category,
        String brand,
        String imageUrl,
        double price,
        boolean fastDelivery
) {
}
