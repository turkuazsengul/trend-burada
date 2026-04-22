package com.trendburada.cart.application;

public record CartPreview(
        int itemCount,
        double subtotal,
        double cargo,
        double discount,
        double total
) {
}
