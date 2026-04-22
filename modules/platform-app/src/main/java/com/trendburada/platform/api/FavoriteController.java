package com.trendburada.platform.api;

import com.trendburada.favorite.application.CreateFavoriteRequest;
import com.trendburada.favorite.application.FavoriteItem;
import com.trendburada.favorite.application.FavoriteQueryService;
import com.trendburada.favorite.application.FavoriteSnapshot;
import com.trendburada.shared.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController {

    private final FavoriteQueryService favoriteQueryService;

    public FavoriteController(FavoriteQueryService favoriteQueryService) {
        this.favoriteQueryService = favoriteQueryService;
    }

    @GetMapping("/snapshot")
    public ApiResponse<FavoriteSnapshot> snapshot(@RequestParam String customerCode) {
        return ApiResponse.ok(favoriteQueryService.getSnapshot(customerCode));
    }

    @GetMapping
    public ApiResponse<List<FavoriteItem>> favorites(@RequestParam String customerCode) {
        return ApiResponse.ok(favoriteQueryService.getFavorites(customerCode));
    }

    @PostMapping
    public ApiResponse<FavoriteItem> create(@RequestBody CreateFavoriteRequest request) {
        return ApiResponse.ok(favoriteQueryService.create(request));
    }
}
