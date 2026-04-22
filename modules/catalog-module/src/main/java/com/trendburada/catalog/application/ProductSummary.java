package com.trendburada.catalog.application;

public record ProductSummary(
        String id,
        String title,
        String category,
        String brand,
        double price,
        boolean fastDelivery
) {
}
