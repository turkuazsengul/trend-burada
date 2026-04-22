package com.trendburada.favorite.application;

import org.springframework.stereotype.Service;

@Service
public class FavoriteQueryService {

    public FavoriteSnapshot getSnapshot() {
        return new FavoriteSnapshot(8);
    }
}
