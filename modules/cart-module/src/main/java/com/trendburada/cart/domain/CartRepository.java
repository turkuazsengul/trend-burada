package com.trendburada.cart.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<CartEntity, Long> {

    Optional<CartEntity> findByCustomerCode(String customerCode);

    Optional<CartEntity> findByCartCode(String cartCode);
}
