package com.trendburada.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Value-typed row in {@code catalog.product_color_options}.
 *
 * <p>Lives in {@code domain} (not {@code application}) on purpose: the
 * application-side {@link com.trendburada.catalog.application.ProductColorOption}
 * record is the API/DTO shape, this is the persistence shape. The two are
 * not always 1:1 — DTOs come and go without forcing a migration.
 */
@Embeddable
public class ProductColorOptionEmbeddable {

    @Column(name = "name", nullable = false, length = 64)
    private String name;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    public ProductColorOptionEmbeddable() {
    }

    public ProductColorOptionEmbeddable(String name, String imageUrl) {
        this.name = name;
        this.imageUrl = imageUrl;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
