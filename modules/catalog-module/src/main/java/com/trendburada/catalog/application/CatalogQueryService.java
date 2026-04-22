package com.trendburada.catalog.application;

import com.trendburada.catalog.domain.ProductEntity;
import com.trendburada.catalog.domain.ProductRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class CatalogQueryService {

    private final ProductRepository productRepository;

    public CatalogQueryService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductSummary> getFeaturedProducts() {
        return getProducts(null);
    }

    public List<ProductSummary> getProducts(String category) {
        if (category == null || category.isBlank()) {
            return productRepository.findAllByOrderByProductCodeAsc().stream().map(this::map).toList();
        }
        return productRepository.findByCategoryIgnoreCaseOrderByProductCodeAsc(category.trim()).stream().map(this::map).toList();
    }

    public List<ProductFacet> getFacets(String category) {
        List<ProductEntity> products = category == null || category.isBlank()
                ? productRepository.findAllByOrderByProductCodeAsc()
                : productRepository.findByCategoryIgnoreCaseOrderByProductCodeAsc(category.trim());

        return List.of(
                new ProductFacet("mark", "Marka", buildOptions(products, ProductEntity::getBrand)),
                new ProductFacet("size", "Beden", buildOptions(products, ProductEntity::getSize)),
                new ProductFacet("color", "Renk", buildOptions(products, ProductEntity::getColor)),
                new ProductFacet("isFastDelivery", "Teslimat", List.of(
                        new FacetOption("true", "Hizli Teslimat", (int) products.stream().filter(ProductEntity::isFastDelivery).count())
                ))
        );
    }

    public Optional<ProductSummary> getProductById(String productId) {
        if (productId == null || productId.isBlank()) {
            return Optional.empty();
        }
        return productRepository.findByProductCode(productId.trim()).map(this::map);
    }

    public ProductSummary create(CreateProductRequest request) {
        ProductEntity entity = new ProductEntity();
        entity.setProductCode("prd-" + System.currentTimeMillis());
        entity.setTitle(request.title());
        entity.setCategory(request.category());
        entity.setBrand(request.brand());
        entity.setImageUrl(request.imageUrl());
        entity.setOldPrice(request.oldPrice());
        entity.setDiscountRate(request.discountRate());
        entity.setRating(request.rating());
        entity.setReviewCount(request.reviewCount());
        entity.setColor(request.color());
        entity.setSize(request.size());
        entity.setFreeCargo(request.freeCargo());
        entity.setPrice(request.price());
        entity.setFastDelivery(request.fastDelivery());
        entity.setSellerScore(request.sellerScore());
        entity.setInstallmentText(request.installmentText());
        return map(productRepository.save(entity));
    }

    private ProductSummary map(ProductEntity entity) {
        return new ProductSummary(
                entity.getProductCode(),
                entity.getTitle(),
                entity.getCategory(),
                entity.getBrand(),
                entity.getBrand(),
                entity.getImageUrl(),
                entity.getImageUrl(),
                entity.getOldPrice(),
                entity.getDiscountRate(),
                entity.getRating(),
                entity.getReviewCount(),
                entity.getColor(),
                entity.getSize(),
                entity.isFreeCargo(),
                entity.isFreeCargo(),
                entity.getPrice(),
                entity.isFastDelivery(),
                entity.isFastDelivery(),
                entity.getSellerScore(),
                entity.getInstallmentText()
        );
    }

    private List<FacetOption> buildOptions(List<ProductEntity> products, java.util.function.Function<ProductEntity, String> getter) {
        java.util.Map<String, Integer> counts = new java.util.LinkedHashMap<>();
        for (ProductEntity entity : products) {
            String value = getter.apply(entity);
            if (value == null || value.isBlank()) {
                continue;
            }
            counts.merge(value, 1, Integer::sum);
        }

        List<FacetOption> options = new ArrayList<>();
        for (java.util.Map.Entry<String, Integer> entry : counts.entrySet()) {
            options.add(new FacetOption(entry.getKey(), entry.getKey(), entry.getValue()));
        }
        return options;
    }
}
