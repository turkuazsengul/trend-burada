package com.trendburada.shared;

/**
 * Base for application-level errors that should surface to the client with a deterministic
 * HTTP status. The global controller advice in {@code ApiExceptionHandler} maps any subclass
 * to {@code httpStatus} + {@link ApiResponse#message()} (with {@code success=false}).
 *
 * <p>Subclass via the prebuilt {@link NotFoundException}, {@link BadRequestException},
 * {@link ConflictException} for the common cases. For something more specific, extend the
 * matching status-tier subclass and add the domain context (e.g. {@code AddressNotFoundException
 * extends NotFoundException}); that keeps the status mapping in one place while letting
 * domain code throw a meaningful type.
 *
 * <p>Kept Spring-free on purpose so {@code shared-kernel} stays a leaf module.
 */
public abstract class BusinessException extends RuntimeException {

    private final int httpStatus;

    protected BusinessException(int httpStatus, String message) {
        super(message);
        this.httpStatus = httpStatus;
    }

    public int getHttpStatus() {
        return httpStatus;
    }
}
