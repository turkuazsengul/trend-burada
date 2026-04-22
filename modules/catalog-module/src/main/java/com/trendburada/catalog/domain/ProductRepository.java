package com.trendburada.catalog.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {
    List<ProductEntity> findAllByOrderByProductCodeAsc();
    List<ProductEntity> findByCategoryIgnoreCaseOrderByProductCodeAsc(String category);
    Optional<ProductEntity> findByProductCode(String productCode);
}
