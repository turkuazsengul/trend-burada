package com.trendburada.order.application;

public record CreateOrderRequest(
        String customerCode,
        String status,
        double totalAmount
) {
}
