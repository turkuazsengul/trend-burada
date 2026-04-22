package com.trendburada.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(schema = "catalog", name = "products")
public class ProductEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String productCode;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 100)
    private String brand;

    @Column(length = 500)
    private String imageUrl;

    @Column
    private double oldPrice;

    @Column
    private int discountRate;

    @Column
    private double rating;

    @Column
    private int reviewCount;

    @Column(length = 64)
    private String color;

    @Column(length = 16)
    private String size;

    @Column(nullable = false)
    private boolean freeCargo;

    @Column(nullable = false)
    private double price;

    @Column(nullable = false)
    private boolean fastDelivery;

    @Column
    private double sellerScore;

    @Column(length = 64)
    private String installmentText;

    public Long getId() {
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

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public double getOldPrice() {
        return oldPrice;
    }

    public void setOldPrice(double oldPrice) {
        this.oldPrice = oldPrice;
    }

    public int getDiscountRate() {
        return discountRate;
    }

    public void setDiscountRate(int discountRate) {
        this.discountRate = discountRate;
    }

    public double getRating() {
        return rating;
    }

    public void setRating(double rating) {
        this.rating = rating;
    }

    public int getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(int reviewCount) {
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
        return freeCargo;
    }

    public void setFreeCargo(boolean freeCargo) {
        this.freeCargo = freeCargo;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public boolean isFastDelivery() {
        return fastDelivery;
    }

    public void setFastDelivery(boolean fastDelivery) {
        this.fastDelivery = fastDelivery;
    }

    public double getSellerScore() {
        return sellerScore;
    }

    public void setSellerScore(double sellerScore) {
        this.sellerScore = sellerScore;
    }

    public String getInstallmentText() {
        return installmentText;
    }

    public void setInstallmentText(String installmentText) {
        this.installmentText = installmentText;
    }
}
