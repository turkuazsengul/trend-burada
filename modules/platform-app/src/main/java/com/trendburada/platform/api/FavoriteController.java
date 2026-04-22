package com.trendburada.platform.api;

import com.trendburada.favorite.application.FavoriteQueryService;
import com.trendburada.favorite.application.FavoriteSnapshot;
import com.trendburada.shared.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController {

    private final FavoriteQueryService favoriteQueryService;

    public FavoriteController(FavoriteQueryService favoriteQueryService) {
        this.favoriteQueryService = favoriteQueryService;
    }

    @GetMapping("/snapshot")
    public ApiResponse<FavoriteSnapshot> snapshot() {
        return ApiResponse.ok(favoriteQueryService.getSnapshot());
    }
}
