package com.trendburada.customer.application;

/**
 * Read-side projection of a customer used by both the legacy {@code /profile} debug endpoint
 * and the JWT-scoped {@code /api/v1/customer/me} self-service endpoint.
 *
 * <p>Field shape rationale:
 * <ul>
 *   <li>{@code customerId} is the business-facing {@code customerCode} (e.g. {@code cust-1234}),
 *       not the row UUID. Internal IDs never leave the API boundary.</li>
 *   <li>{@code gender} is the canonical uppercase form stored in the DB
 *       ({@code MALE | FEMALE | UNSPECIFIED} or {@code null}). The FE lowercases it for radio
 *       buttons; the round-trip is symmetric so a PATCH-then-GET yields the same value the
 *       UI just sent.</li>
 *   <li>{@code birthDate} is serialised as ISO-8601 {@code yyyy-MM-dd} string rather than a
 *       {@link java.time.LocalDate} so the JSON shape matches what the FE
 *       {@code dateToIso} helper sends — no Jackson Java-time module quirks at the contract
 *       boundary.</li>
 *   <li>{@code phone} is exactly what was stored after passing the controller's regex
 *       validation. No formatting normalisation; the FE renders it as-is.</li>
 * </ul>
 *
 * <p>All three new fields are nullable: a freshly provisioned customer has not filled the
 * profile in yet, and the FE renders empty inputs in that case.
 */
public record CustomerProfileSummary(
        String customerId,
        String fullName,
        String email,
        String segment,
        String preferredCategory,
        String gender,
        String birthDate,
        String phone
) {
}
