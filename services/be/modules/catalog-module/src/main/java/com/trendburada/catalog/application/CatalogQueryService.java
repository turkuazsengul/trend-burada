package com.trendburada.catalog.application;

import com.trendburada.catalog.domain.ProductAttributeEmbeddable;
import com.trendburada.catalog.domain.ProductColorOptionEmbeddable;
import com.trendburada.catalog.domain.ProductEntity;
import com.trendburada.catalog.domain.ProductRepository;
import com.trendburada.shared.PagedResult;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
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
        return getProducts(ProductAccessScope.anonymous(), null, 0, 12).items();
    }

    public PagedResult<ProductSummary> getProducts(ProductAccessScope accessScope, String category, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                normalizeSize(size),
                Sort.by(Sort.Direction.ASC, "productCode")
        );
        Page<ProductEntity> resultPage = findProducts(accessScope, category, pageable);

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

    public List<ProductFacet> getFacets(ProductAccessScope accessScope, String category) {
        List<ProductEntity> products = findFacetProducts(accessScope, category);

        return List.of(
                new ProductFacet("mark", "Marka", buildOptions(products, ProductEntity::getBrand)),
                new ProductFacet("size", "Beden", buildOptions(products, ProductEntity::getSize)),
                new ProductFacet("color", "Renk", buildOptions(products, ProductEntity::getColor)),
                new ProductFacet("isFastDelivery", "Teslimat", List.of(
                        new FacetOption("true", "Hizli Teslimat", (int) products.stream().filter(ProductEntity::isFastDelivery).count())
                ))
        );
    }

    public Optional<ProductSummary> getProductById(ProductAccessScope accessScope, String productId) {
        if (productId == null || productId.isBlank()) {
            return Optional.empty();
        }
        return findVisibleProduct(accessScope, productId.trim()).map(this::map);
    }

    public Optional<ProductDetail> getProductDetailById(String productId) {
        if (productId == null || productId.isBlank()) {
            return Optional.empty();
        }
        return resolveProduct(productId.trim()).map(this::mapDetail);
    }

    public ProductSummary create(ProductAccessScope accessScope, CreateProductRequest request) {
        ProductEntity entity = new ProductEntity();
        entity.setProductCode(generateProductCode(request.category(), request.title()));
        apply(entity, request);
        entity.setSellerEmail(requireOwnerEmail(accessScope));
        return map(productRepository.save(entity));
    }

    public Optional<ProductSummary> update(ProductAccessScope accessScope, String productId, UpdateProductRequest request) {
        if (productId == null || productId.isBlank()) {
            return Optional.empty();
        }
        return resolveManagedProduct(accessScope, productId.trim())
                .map(entity -> {
                    apply(entity, request);
                    return map(productRepository.save(entity));
                });
    }

    public boolean delete(ProductAccessScope accessScope, String productId) {
        if (productId == null || productId.isBlank()) {
            return false;
        }

        return resolveManagedProduct(accessScope, productId.trim())
                .map(entity -> {
                    productRepository.delete(entity);
                    return true;
                })
                .orElse(false);
    }

    private Page<ProductEntity> findProducts(ProductAccessScope accessScope, String category, Pageable pageable) {
        String normalizedCategory = category == null || category.isBlank() ? null : category.trim();
        if (accessScope != null && accessScope.isSellerScoped()) {
            String ownerEmail = accessScope.normalizedPrincipalEmail();
            return normalizedCategory == null
                    ? productRepository.findBySellerEmailIgnoreCase(ownerEmail, pageable)
                    : productRepository.findBySellerEmailIgnoreCaseAndCategoryIgnoreCase(ownerEmail, normalizedCategory, pageable);
        }

        return normalizedCategory == null
                ? productRepository.findAllBy(pageable)
                : productRepository.findByCategoryIgnoreCase(normalizedCategory, pageable);
    }

    private List<ProductEntity> findFacetProducts(ProductAccessScope accessScope, String category) {
        String normalizedCategory = category == null || category.isBlank() ? null : category.trim();
        if (accessScope != null && accessScope.isSellerScoped()) {
            String ownerEmail = accessScope.normalizedPrincipalEmail();
            return normalizedCategory == null
                    ? productRepository.findBySellerEmailIgnoreCaseOrderByProductCodeAsc(ownerEmail)
                    : productRepository.findBySellerEmailIgnoreCaseAndCategoryIgnoreCaseOrderByProductCodeAsc(ownerEmail, normalizedCategory);
        }

        return normalizedCategory == null
                ? productRepository.findAll(Sort.by(Sort.Direction.ASC, "productCode"))
                : productRepository.findByCategoryIgnoreCaseOrderByProductCodeAsc(normalizedCategory);
    }

    private Optional<ProductEntity> findVisibleProduct(ProductAccessScope accessScope, String identifier) {
        if (accessScope != null && accessScope.isSellerScoped()) {
            String ownerEmail = accessScope.normalizedPrincipalEmail();
            return resolveProduct(identifier)
                    .filter(product -> ownerEmail.equalsIgnoreCase(product.getSellerEmail()));
        }
        return resolveProduct(identifier);
    }

    private Optional<ProductEntity> resolveManagedProduct(ProductAccessScope accessScope, String identifier) {
        Optional<ProductEntity> product = resolveProduct(identifier);
        if (product.isEmpty()) {
            return Optional.empty();
        }

        if (accessScope != null && accessScope.admin()) {
            return product;
        }

        if (accessScope == null || !accessScope.isSellerScoped()) {
            throw new AccessDeniedException("Bu islem icin seller veya admin yetkisi gereklidir.");
        }

        String ownerEmail = accessScope.normalizedPrincipalEmail();
        ProductEntity entity = product.get();
        if (!ownerEmail.equalsIgnoreCase(entity.getSellerEmail())) {
            throw new AccessDeniedException("Yalnizca kendi urunlerinizi yonetebilirsiniz.");
        }
        return Optional.of(entity);
    }

    private Optional<ProductEntity> resolveProduct(String identifier) {
        Optional<UUID> parsedId = parseUuid(identifier);
        if (parsedId.isPresent()) {
            Optional<ProductEntity> byId = productRepository.findById(parsedId.get());
            if (byId.isPresent()) {
                return byId;
            }
        }
        return productRepository.findByProductCode(identifier);
    }

    private Optional<UUID> parseUuid(String identifier) {
        try {
            return Optional.of(UUID.fromString(identifier));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    private String requireOwnerEmail(ProductAccessScope accessScope) {
        if (accessScope == null || !accessScope.authenticated() || accessScope.normalizedPrincipalEmail() == null) {
            throw new AccessDeniedException("Urun olusturmak icin giris yapmalisiniz.");
        }
        return accessScope.normalizedPrincipalEmail();
    }

    private void apply(ProductEntity entity, CreateProductRequest request) {
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
        entity.setSizeOptions(toStringList(request.sizeOptions()));
        entity.setColorOptions(toColorEmbeddables(request.colorOptions()));
        entity.setHighlights(toStringList(request.highlights()));
        entity.setAttributes(toAttributeEmbeddables(request.attributes()));
    }

    private void apply(ProductEntity entity, UpdateProductRequest request) {
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
        entity.setSizeOptions(toStringList(request.sizeOptions()));
        entity.setColorOptions(toColorEmbeddables(request.colorOptions()));
        entity.setHighlights(toStringList(request.highlights()));
        entity.setAttributes(toAttributeEmbeddables(request.attributes()));
    }

    private String generateProductCode(String category, String title) {
        String categoryPart = slugPart(category, "urun");
        String titlePart = slugPart(title, "yeni");
        return categoryPart + "-" + titlePart + "-" + System.currentTimeMillis();
    }

    private String slugPart(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String normalized = value.trim().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.isBlank() ? fallback : normalized;
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
                new ArrayList<>(entity.getSizeOptions()),
                entity.getColorOptions().stream()
                        .map(opt -> new ProductColorOption(opt.getName(), opt.getImageUrl()))
                        .toList(),
                new ArrayList<>(entity.getHighlights()),
                entity.getAttributes().stream()
                        .map(attr -> new ProductAttribute(attr.getLabel(), attr.getValue()))
                        .toList()
        );
    }

    /**
     * DTO -> entity adapters used by {@link #apply}. Skip null/blank items so a request
     * like {@code sizeOptions: ["", null, "M"]} doesn't write empty rows that violate
     * the NOT NULL constraint on {@code value} / {@code label}.
     */
    private static List<String> toStringList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return new ArrayList<>();
        }
        List<String> out = new ArrayList<>(values.size());
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                out.add(v);
            }
        }
        return out;
    }

    private static List<ProductColorOptionEmbeddable> toColorEmbeddables(List<ProductColorOption> values) {
        if (values == null || values.isEmpty()) {
            return new ArrayList<>();
        }
        List<ProductColorOptionEmbeddable> out = new ArrayList<>(values.size());
        for (ProductColorOption v : values) {
            if (v != null && v.name() != null && !v.name().isBlank()) {
                out.add(new ProductColorOptionEmbeddable(v.name(), v.image()));
            }
        }
        return out;
    }

    private static List<ProductAttributeEmbeddable> toAttributeEmbeddables(List<ProductAttribute> values) {
        if (values == null || values.isEmpty()) {
            return new ArrayList<>();
        }
        List<ProductAttributeEmbeddable> out = new ArrayList<>(values.size());
        for (ProductAttribute v : values) {
            if (v != null && v.label() != null && !v.label().isBlank()
                    && v.value() != null && !v.value().isBlank()) {
                out.add(new ProductAttributeEmbeddable(v.label(), v.value()));
            }
        }
        return out;
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
