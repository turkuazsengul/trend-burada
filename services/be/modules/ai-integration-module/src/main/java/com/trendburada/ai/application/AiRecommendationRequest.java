package com.trendburada.ai.application;

public record AiRecommendationRequest(
        String customerId,
        String category,
        String usage,
        String style,
        double budget
) {
}
