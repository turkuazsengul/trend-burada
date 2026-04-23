package com.trendburada.favorite.application;

import java.util.UUID;

public record FavoriteItem(
        UUID id,
        String customerCode,
        String productCode
) {
}
