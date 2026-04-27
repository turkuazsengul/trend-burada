package com.trendburada.cart.application;

import java.util.UUID;

public record CartItemView(
        UUID id,
        String cartCode,
        String productCode,
        int quantity,
        double unitPrice
) {
}
