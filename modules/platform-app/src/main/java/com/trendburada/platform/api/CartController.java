package com.trendburada.platform.api;

import com.trendburada.cart.application.CartPreview;
import com.trendburada.cart.application.CartQueryService;
import com.trendburada.shared.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartQueryService cartQueryService;

    public CartController(CartQueryService cartQueryService) {
        this.cartQueryService = cartQueryService;
    }

    @GetMapping("/preview")
    public ApiResponse<CartPreview> preview() {
        return ApiResponse.ok(cartQueryService.getPreview());
    }
}
