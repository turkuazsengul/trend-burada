package com.trendburada.platform.api;

import com.trendburada.cart.application.CartItemView;
import com.trendburada.cart.application.CartPreview;
import com.trendburada.cart.application.CartQueryService;
import com.trendburada.cart.application.CreateCartItemRequest;
import com.trendburada.shared.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartQueryService cartQueryService;

    public CartController(CartQueryService cartQueryService) {
        this.cartQueryService = cartQueryService;
    }

    @GetMapping("/preview")
    public ApiResponse<CartPreview> preview(@RequestParam String customerCode) {
        return ApiResponse.ok(cartQueryService.getPreview(customerCode));
    }

    @GetMapping("/items")
    public ApiResponse<List<CartItemView>> items(@RequestParam String customerCode) {
        return ApiResponse.ok(cartQueryService.getItems(customerCode));
    }

    @PostMapping("/items")
    public ApiResponse<CartItemView> addItem(@RequestBody CreateCartItemRequest request) {
        return ApiResponse.ok(cartQueryService.addItem(request));
    }
}
