package com.trendburada.catalog.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductRepository extends JpaRepository<ProductEntity, UUID> {
    Page<ProductEntity> findAllBy(Pageable pageable);
    Page<ProductEntity> findByCategoryIgnoreCase(String category, Pageable pageable);
    Page<ProductEntity> findBySellerEmailIgnoreCase(String sellerEmail, Pageable pageable);
    Page<ProductEntity> findBySellerEmailIgnoreCaseAndCategoryIgnoreCase(String sellerEmail, String category, Pageable pageable);
    List<ProductEntity> findByCategoryIgnoreCaseOrderByProductCodeAsc(String category);
    List<ProductEntity> findBySellerEmailIgnoreCaseOrderByProductCodeAsc(String sellerEmail);
    List<ProductEntity> findBySellerEmailIgnoreCaseAndCategoryIgnoreCaseOrderByProductCodeAsc(String sellerEmail, String category);
    Optional<ProductEntity> findByProductCode(String productCode);
    Optional<ProductEntity> findByProductCodeAndSellerEmailIgnoreCase(String productCode, String sellerEmail);
}
