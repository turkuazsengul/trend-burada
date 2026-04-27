package com.trendburada.platform.api;

import com.trendburada.cart.application.CartItemView;
import com.trendburada.cart.application.CartPreview;
import com.trendburada.cart.application.CartQueryService;
import com.trendburada.cart.application.CreateCartItemRequest;
import com.trendburada.shared.ApiResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartQueryService cartQueryService;
    private final AuthenticatedCustomerResolver customerResolver;

    public CartController(CartQueryService cartQueryService,
                          AuthenticatedCustomerResolver customerResolver) {
        this.cartQueryService = cartQueryService;
        this.customerResolver = customerResolver;
    }

    @GetMapping("/preview")
    public ApiResponse<CartPreview> preview(Authentication authentication) {
        String customerCode = customerResolver.resolveCustomerCode(authentication);
        return ApiResponse.ok(cartQueryService.getPreview(customerCode));
    }

    @GetMapping("/items")
    public ApiResponse<List<CartItemView>> items(Authentication authentication) {
        String customerCode = customerResolver.resolveCustomerCode(authentication);
        return ApiResponse.ok(cartQueryService.getItems(customerCode));
    }

    @PostMapping("/items")
    public ApiResponse<CartItemView> addItem(Authentication authentication,
                                             @RequestBody CreateCartItemRequest request) {
        String customerCode = customerResolver.resolveCustomerCode(authentication);
        // Any customerCode supplied in the request body is intentionally ignored.
        // Ownership is derived solely from the authenticated principal.
        CreateCartItemRequest trustedRequest = new CreateCartItemRequest(
                customerCode,
                request.productCode(),
                request.quantity(),
                request.unitPrice());
        return ApiResponse.ok(cartQueryService.addItem(trustedRequest));
    }
}
