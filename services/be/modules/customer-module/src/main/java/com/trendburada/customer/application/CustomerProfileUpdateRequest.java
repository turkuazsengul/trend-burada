package com.trendburada.customer.application;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Partial-update payload for {@code PATCH /api/v1/customer/me}.
 *
 * <p>Every field is nullable on purpose &mdash; PATCH is partial, so the FE may send any
 * subset (e.g. just {@code phone} when the user approves the OTP, just
 * {@code gender + birthDate} from the profile form). A {@code null} field means &quot;don't
 * touch&quot;; an empty string means &quot;clear&quot; and is rejected by the regexes
 * below so callers must explicitly send {@code null} to clear a value.
 *
 * <p>Identity fields (fullName, email, customerCode) are intentionally NOT exposed here.
 * They are managed by the auth module / IdP and any change to them must go through the
 * verified-email flow, not a self-service PATCH.
 *
 * <p>Validation rules:
 * <ul>
 *   <li>{@code gender}: case-insensitive enum check ({@code male | female | unspecified}).
 *       The service normalises to UPPERCASE before persisting, mirroring the comment on
 *       {@code CustomerEntity.gender}.</li>
 *   <li>{@code birthDate}: strict ISO-8601 {@code yyyy-MM-dd} format. The service parses
 *       with {@link java.time.LocalDate#parse(CharSequence)} after the regex passes; an
 *       impossible date like {@code 2026-02-31} therefore surfaces as 400, not 500.</li>
 *   <li>{@code phone}: same regex as
 *       {@link AddressRequest#phone()} so the &quot;valid phone&quot; rule is consistent
 *       across the customer-facing API. Source of truth lives there.</li>
 * </ul>
 *
 * <p>Validation failures bubble up as {@link org.springframework.web.bind.MethodArgumentNotValidException}
 * which {@code ApiExceptionHandler} maps to a 400 with a {@code {field: message}} body the
 * FE's {@code extractFieldErrors} helper unpacks.
 */
public record CustomerProfileUpdateRequest(
        @Size(max = 16)
        @Pattern(
                regexp = "^(?i)(male|female|unspecified)$",
                message = "gender must be one of: male, female, unspecified"
        ) String gender,

        @Size(max = 10)
        @Pattern(
                regexp = "^\\d{4}-\\d{2}-\\d{2}$",
                message = "birthDate must be ISO-8601 yyyy-MM-dd"
        ) String birthDate,

        @Size(max = 30)
        @Pattern(
                regexp = "^[+0-9 ()\\-]{6,30}$",
                message = "phone must contain digits, spaces, parentheses, dashes or a leading +"
        ) String phone
) {
}
