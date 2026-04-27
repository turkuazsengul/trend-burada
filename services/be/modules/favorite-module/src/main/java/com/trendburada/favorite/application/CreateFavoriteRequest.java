package com.trendburada.favorite.application;

public record CreateFavoriteRequest(
        String customerCode,
        String productCode
) {
}
