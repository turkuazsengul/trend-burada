package com.trendburada.platform.api;

import com.trendburada.favorite.application.CreateFavoriteRequest;
import com.trendburada.favorite.application.FavoriteItem;
import com.trendburada.favorite.application.FavoriteQueryService;
import com.trendburada.favorite.application.FavoriteSnapshot;
import com.trendburada.shared.ApiResponse;
import com.trendburada.shared.PagedResult;
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
    public ApiResponse<PagedResult<FavoriteItem>> favorites(@RequestParam String customerCode,
                                                            @RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(favoriteQueryService.getFavorites(customerCode, page, size));
    }

    @PostMapping
    public ApiResponse<FavoriteItem> create(@RequestBody CreateFavoriteRequest request) {
        return ApiResponse.ok(favoriteQueryService.create(request));
    }
}
