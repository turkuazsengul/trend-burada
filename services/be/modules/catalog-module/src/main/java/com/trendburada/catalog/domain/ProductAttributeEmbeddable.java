package com.trendburada.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Value-typed row in {@code catalog.product_attributes}.
 * Persistence twin of {@link com.trendburada.catalog.application.ProductAttribute}.
 */
@Embeddable
public class ProductAttributeEmbeddable {

    @Column(name = "label", nullable = false, length = 64)
    private String label;

    @Column(name = "value", nullable = false, length = 255)
    private String value;

    public ProductAttributeEmbeddable() {
    }

    public ProductAttributeEmbeddable(String label, String value) {
        this.label = label;
        this.value = value;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
