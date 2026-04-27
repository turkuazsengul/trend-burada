package com.trendburada.ai.application;

import java.util.List;

public record AiRecommendationResponse(
        String strategy,
        String recommendationSummary,
        List<String> productIds
) {
}
