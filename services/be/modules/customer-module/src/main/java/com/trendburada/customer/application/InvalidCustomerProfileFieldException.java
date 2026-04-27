package com.trendburada.customer.application;

/**
 * Thrown by {@link CustomerQueryService#patchMe} when a profile field passes
 * {@code @Valid} bean-validation but fails a deeper, runtime-only check &mdash; today the
 * only such case is {@code birthDate} matching the ISO regex but representing an impossible
 * calendar day (e.g. {@code 2026-02-31}).
 *
 * <p>Mapped by {@code ApiExceptionHandler} to a 400 with the same {@code {field: message}}
 * body shape that {@code MethodArgumentNotValidException} produces, so the FE's
 * {@code extractFieldErrors} hook can unpack both without a special case.
 */
public class InvalidCustomerProfileFieldException extends RuntimeException {

    private final String field;

    public InvalidCustomerProfileFieldException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
