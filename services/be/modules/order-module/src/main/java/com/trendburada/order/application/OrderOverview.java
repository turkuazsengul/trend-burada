package com.trendburada.order.application;

public record OrderOverview(
        String orderId,
        String status,
        double totalAmount
) {
}
