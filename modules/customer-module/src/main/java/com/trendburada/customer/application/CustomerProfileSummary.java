package com.trendburada.customer.application;

public record CustomerProfileSummary(
        String customerId,
        String fullName,
        String email,
        String segment,
        String preferredCategory
) {
}
