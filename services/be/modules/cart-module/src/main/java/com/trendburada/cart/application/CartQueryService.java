package com.trendburada.cart.application;

import com.trendburada.cart.domain.CartEntity;
import com.trendburada.cart.domain.CartItemEntity;
import com.trendburada.cart.domain.CartItemRepository;
import com.trendburada.cart.domain.CartRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CartQueryService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    public CartQueryService(CartRepository cartRepository, CartItemRepository cartItemRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
    }

    public CartPreview getPreview(String customerCode) {
        CartEntity cart = cartRepository.findByCustomerCode(customerCode).orElse(null);
        if (cart == null) {
            return new CartPreview(0, 0, 0, 0, 0);
        }

        List<CartItemEntity> items = cartItemRepository.findByCartCode(cart.getCartCode());
        double subtotal = items.stream().mapToDouble(item -> item.getUnitPrice() * item.getQuantity()).sum();
        double cargo = subtotal >= 350 ? 0 : 39.90;
        double discount = subtotal > 2500 ? Math.round(subtotal * 0.05) : 0;
        return new CartPreview(items.stream().mapToInt(CartItemEntity::getQuantity).sum(), subtotal, cargo, discount,
                Math.max(0, subtotal + cargo - discount));
    }

    public List<CartItemView> getItems(String customerCode) {
        CartEntity cart = cartRepository.findByCustomerCode(customerCode).orElse(null);
        if (cart == null) {
            return List.of();
        }

        return cartItemRepository.findByCartCode(cart.getCartCode()).stream()
                .map(item -> new CartItemView(item.getId(), item.getCartCode(), item.getProductCode(), item.getQuantity(), item.getUnitPrice()))
                .toList();
    }

    public CartItemView addItem(CreateCartItemRequest request) {
        CartEntity cart = cartRepository.findByCustomerCode(request.customerCode())
                .orElseGet(() -> {
                    CartEntity entity = new CartEntity();
                    entity.setCartCode("cart-" + System.currentTimeMillis());
                    entity.setCustomerCode(request.customerCode());
                    return cartRepository.save(entity);
                });

        CartItemEntity item = new CartItemEntity();
        item.setCartCode(cart.getCartCode());
        item.setProductCode(request.productCode());
        item.setQuantity(request.quantity());
        item.setUnitPrice(request.unitPrice());
        CartItemEntity saved = cartItemRepository.save(item);
        return new CartItemView(saved.getId(), saved.getCartCode(), saved.getProductCode(), saved.getQuantity(), saved.getUnitPrice());
    }
}
