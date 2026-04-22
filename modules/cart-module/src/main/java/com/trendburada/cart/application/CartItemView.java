package com.trendburada.cart.application;

public record CartItemView(
        Long id,
        String cartCode,
        String productCode,
        int quantity,
        double unitPrice
) {
}
