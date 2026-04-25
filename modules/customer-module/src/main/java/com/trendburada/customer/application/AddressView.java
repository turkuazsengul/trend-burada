package com.trendburada.customer.application;

import java.time.Instant;
import java.util.UUID;

/**
 * Read-only projection of {@link com.trendburada.customer.domain.AddressEntity} returned to
 * API clients. Note that {@code customerId} is intentionally omitted: ownership is implicit
 * because every {@code /customer/me/addresses} endpoint resolves the customer from the JWT,
 * and exposing it would invite clients to start passing it back as &quot;identity&quot;.
 */
public record AddressView(
        UUID id,
        String title,
        String fullName,
        String phone,
        String country,
        String city,
        String district,
        String neighborhood,
        String addressLine,
        String postalCode,
        boolean isDefault,
        Instant createdAt,
        Instant updatedAt
) {
}
