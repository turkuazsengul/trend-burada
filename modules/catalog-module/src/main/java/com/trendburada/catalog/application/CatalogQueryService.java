package com.trendburada.catalog.application;

import com.trendburada.catalog.domain.ProductEntity;
import com.trendburada.catalog.domain.ProductRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CatalogQueryService {

    private final ProductRepository productRepository;

    public CatalogQueryService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductSummary> getFeaturedProducts() {
        return productRepository.findAll().stream().map(this::map).toList();
    }

    public ProductSummary create(CreateProductRequest request) {
        ProductEntity entity = new ProductEntity();
        entity.setProductCode("prd-" + System.currentTimeMillis());
        entity.setTitle(request.title());
        entity.setCategory(request.category());
        entity.setBrand(request.brand());
        entity.setImageUrl(request.imageUrl());
        entity.setPrice(request.price());
        entity.setFastDelivery(request.fastDelivery());
        return map(productRepository.save(entity));
    }

    private ProductSummary map(ProductEntity entity) {
        return new ProductSummary(
                entity.getProductCode(),
                entity.getTitle(),
                entity.getCategory(),
                entity.getBrand(),
                entity.getImageUrl(),
                entity.getPrice(),
                entity.isFastDelivery()
        );
    }
}
