package com.trendburada.catalog.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(schema = "catalog", name = "products")
public class ProductEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false, columnDefinition = "UUID DEFAULT gen_random_uuid()")
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String productCode;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 100)
    private String brand;

    @Column(nullable = false, length = 255)
    private String sellerEmail;

    @Column(length = 500)
    private String imageUrl;

    @Column
    private Double oldPrice;

    @Column
    private Integer discountRate;

    @Column
    private Double rating;

    @Column
    private Integer reviewCount;

    @Column(length = 64)
    private String color;

    @Column(length = 16)
    private String size;

    @Column(nullable = false)
    private Boolean freeCargo;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Boolean fastDelivery;

    @Column
    private Double sellerScore;

    @Column(length = 64)
    private String installmentText;

    /**
     * @deprecated since TB-09. Replaced by {@link #sizeOptions}. Kept on the
     * entity (and in the DB) so the one-shot {@code ProductOptionsBackfill}
     * listener can read historical rows during the transition; a follow-up
     * migration will drop the column once the backfill is verified.
     */
    @Deprecated
    @Column(columnDefinition = "TEXT")
    private String sizeOptionsJson;

    /** @deprecated see {@link #sizeOptionsJson}. */
    @Deprecated
    @Column(columnDefinition = "TEXT")
    private String colorOptionsJson;

    /** @deprecated see {@link #sizeOptionsJson}. */
    @Deprecated
    @Column(columnDefinition = "TEXT")
    private String highlightsJson;

    /** @deprecated see {@link #sizeOptionsJson}. */
    @Deprecated
    @Column(columnDefinition = "TEXT")
    private String attributesJson;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            schema = "catalog",
            name = "product_size_options",
            joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "position")
    @Column(name = "value", nullable = false, length = 64)
    private List<String> sizeOptions = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            schema = "catalog",
            name = "product_color_options",
            joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "position")
    private List<ProductColorOptionEmbeddable> colorOptions = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            schema = "catalog",
            name = "product_highlights",
            joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "position")
    @Column(name = "value", nullable = false, length = 255)
    private List<String> highlights = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            schema = "catalog",
            name = "product_attributes",
            joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "position")
    private List<ProductAttributeEmbeddable> attributes = new ArrayList<>();

    public UUID getId() {
        return id;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getSellerEmail() {
        return sellerEmail;
    }

    public void setSellerEmail(String sellerEmail) {
        this.sellerEmail = sellerEmail;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public double getOldPrice() {
        return oldPrice == null ? 0 : oldPrice;
    }

    public void setOldPrice(double oldPrice) {
        this.oldPrice = oldPrice;
    }

    public void setOldPrice(Double oldPrice) {
        this.oldPrice = oldPrice;
    }

    public int getDiscountRate() {
        return discountRate == null ? 0 : discountRate;
    }

    public void setDiscountRate(int discountRate) {
        this.discountRate = discountRate;
    }

    public void setDiscountRate(Integer discountRate) {
        this.discountRate = discountRate;
    }

    public double getRating() {
        return rating == null ? 0 : rating;
    }

    public void setRating(double rating) {
        this.rating = rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public int getReviewCount() {
        return reviewCount == null ? 0 : reviewCount;
    }

    public void setReviewCount(int reviewCount) {
        this.reviewCount = reviewCount;
    }

    public void setReviewCount(Integer reviewCount) {
        this.reviewCount = reviewCount;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public boolean isFreeCargo() {
        return Boolean.TRUE.equals(freeCargo);
    }

    public void setFreeCargo(boolean freeCargo) {
        this.freeCargo = freeCargo;
    }

    public void setFreeCargo(Boolean freeCargo) {
        this.freeCargo = freeCargo;
    }

    public double getPrice() {
        return price == null ? 0 : price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public boolean isFastDelivery() {
        return Boolean.TRUE.equals(fastDelivery);
    }

    public void setFastDelivery(boolean fastDelivery) {
        this.fastDelivery = fastDelivery;
    }

    public void setFastDelivery(Boolean fastDelivery) {
        this.fastDelivery = fastDelivery;
    }

    public double getSellerScore() {
        return sellerScore == null ? 0 : sellerScore;
    }

    public void setSellerScore(double sellerScore) {
        this.sellerScore = sellerScore;
    }

    public void setSellerScore(Double sellerScore) {
        this.sellerScore = sellerScore;
    }

    public String getInstallmentText() {
        return installmentText;
    }

    public void setInstallmentText(String installmentText) {
        this.installmentText = installmentText;
    }

    public String getSizeOptionsJson() {
        return sizeOptionsJson;
    }

    public void setSizeOptionsJson(String sizeOptionsJson) {
        this.sizeOptionsJson = sizeOptionsJson;
    }

    public String getColorOptionsJson() {
        return colorOptionsJson;
    }

    public void setColorOptionsJson(String colorOptionsJson) {
        this.colorOptionsJson = colorOptionsJson;
    }

    public String getHighlightsJson() {
        return highlightsJson;
    }

    public void setHighlightsJson(String highlightsJson) {
        this.highlightsJson = highlightsJson;
    }

    public String getAttributesJson() {
        return attributesJson;
    }

    public void setAttributesJson(String attributesJson) {
        this.attributesJson = attributesJson;
    }

    public List<String> getSizeOptions() {
        return sizeOptions;
    }

    public void setSizeOptions(List<String> sizeOptions) {
        this.sizeOptions = sizeOptions == null ? new ArrayList<>() : sizeOptions;
    }

    public List<ProductColorOptionEmbeddable> getColorOptions() {
        return colorOptions;
    }

    public void setColorOptions(List<ProductColorOptionEmbeddable> colorOptions) {
        this.colorOptions = colorOptions == null ? new ArrayList<>() : colorOptions;
    }

    public List<String> getHighlights() {
        return highlights;
    }

    public void setHighlights(List<String> highlights) {
        this.highlights = highlights == null ? new ArrayList<>() : highlights;
    }

    public List<ProductAttributeEmbeddable> getAttributes() {
        return attributes;
    }

    public void setAttributes(List<ProductAttributeEmbeddable> attributes) {
        this.attributes = attributes == null ? new ArrayList<>() : attributes;
    }
}
