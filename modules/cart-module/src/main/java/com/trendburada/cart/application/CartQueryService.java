package com.trendburada.cart.application;

import org.springframework.stereotype.Service;

@Service
public class CartQueryService {

    public CartPreview getPreview() {
        return new CartPreview(3, 4299.70, 0.0, 215.00, 4084.70);
    }
}
