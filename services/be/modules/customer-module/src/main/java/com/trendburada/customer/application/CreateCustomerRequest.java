package com.trendburada.customer.application;

public record CreateCustomerRequest(
        String fullName,
        String email,
        String segment,
        String preferredCategory
) {
}
