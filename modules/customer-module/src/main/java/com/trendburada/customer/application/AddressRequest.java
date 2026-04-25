package com.trendburada.customer.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Input payload for both {@code POST} (create) and {@code PUT} (full replace) on
 * {@code /api/v1/customer/me/addresses}. PUT is intentionally full-replace so the request
 * body has the same shape in both cases &mdash; this keeps the OpenAPI contract small and
 * removes a class of partial-update bugs (e.g. forgetting to clear a previously-set field).
 *
 * <p>Validation lives on the record so any caller (controller, future scheduler, etc.) gets
 * the same input checks. Length limits are tight enough to be useful but stop well short of
 * the column widths in {@link com.trendburada.customer.domain.AddressEntity}, leaving headroom
 * for trailing whitespace etc.
 */
public record AddressRequest(
        @NotBlank @Size(max = 60) String title,
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Size(max = 30)
        @Pattern(
                regexp = "^[+0-9 ()\\-]{6,30}$",
                message = "phone must contain digits, spaces, parentheses, dashes or a leading +"
        ) String phone,
        @NotBlank @Size(max = 60) String country,
        @NotBlank @Size(max = 60) String city,
        @NotBlank @Size(max = 60) String district,
        @Size(max = 80) String neighborhood,
        @NotBlank @Size(max = 500) String addressLine,
        @Size(max = 20) String postalCode,
        boolean isDefault
) {
}
