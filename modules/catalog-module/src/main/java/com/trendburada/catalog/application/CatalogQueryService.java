package com.trendburada.catalog.application;

import com.trendburada.catalog.domain.ProductEntity;
import com.trendburada.catalog.domain.ProductRepository;
import com.trendburada.shared.PagedResult;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class CatalogQueryService {

    private final ProductRepository productRepository;

    public CatalogQueryService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductSummary> getFeaturedProducts() {
        return getProducts(null, 0, 12).items();
    }

    public PagedResult<ProductSummary> getProducts(String category, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                normalizeSize(size),
                Sort.by(Sort.Direction.ASC, "productCode")
        );
        Page<ProductEntity> resultPage = category == null || category.isBlank()
                ? productRepository.findAllBy(pageable)
                : productRepository.findByCategoryIgnoreCase(category.trim(), pageable);

        Page<ProductSummary> mappedPage = resultPage.map(this::map);
        return PagedResult.of(
                mappedPage.getContent(),
                mappedPage.getTotalElements(),
                mappedPage.getNumber(),
                mappedPage.getSize(),
                mappedPage.getTotalPages(),
                mappedPage.hasNext()
        );
    }

    public List<ProductFacet> getFacets(String category) {
        List<ProductEntity> products = category == null || category.isBlank()
                ? productRepository.findAll(Sort.by(Sort.Direction.ASC, "productCode"))
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

    public Optional<ProductDetail> getProductDetailById(String productId) {
        if (productId == null || productId.isBlank()) {
            return Optional.empty();
        }
        return productRepository.findByProductCode(productId.trim()).map(this::mapDetail);
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
                entity.getId().toString(),
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

    private ProductDetail mapDetail(ProductEntity entity) {
        return new ProductDetail(
                entity.getId().toString(),
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
                entity.getInstallmentText(),
                readStringList(entity.getSizeOptionsJson()),
                readColorOptions(entity.getColorOptionsJson()),
                readStringList(entity.getHighlightsJson()),
                readAttributes(entity.getAttributesJson())
        );
    }

    private List<String> readStringList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        List<String> parsed = new ArrayList<>();
        for (String token : value.split("\\|\\|")) {
            if (!token.isBlank()) {
                parsed.add(decode(token));
            }
        }
        return parsed;
    }

    private List<ProductColorOption> readColorOptions(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        List<ProductColorOption> options = new ArrayList<>();
        for (String token : value.split("\\|\\|")) {
            String[] parts = token.split("::", 2);
            if (parts.length == 2) {
                options.add(new ProductColorOption(decode(parts[0]), decode(parts[1])));
            }
        }
        return options;
    }

    private List<ProductAttribute> readAttributes(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        List<ProductAttribute> attributes = new ArrayList<>();
        for (String token : value.split("\\|\\|")) {
            String[] parts = token.split("::", 2);
            if (parts.length == 2) {
                attributes.add(new ProductAttribute(decode(parts[0]), decode(parts[1])));
            }
        }
        return attributes;
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
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

    private int normalizeSize(int size) {
        if (size <= 0) {
            return 24;
        }
        return Math.min(size, 60);
    }
}
