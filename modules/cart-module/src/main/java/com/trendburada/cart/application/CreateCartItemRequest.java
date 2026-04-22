package com.trendburada.cart.application;

public record CreateCartItemRequest(
        String customerCode,
        String productCode,
        int quantity,
        double unitPrice
) {
}
