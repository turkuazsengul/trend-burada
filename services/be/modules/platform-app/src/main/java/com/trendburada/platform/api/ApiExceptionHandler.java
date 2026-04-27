package com.trendburada.platform.api;

import com.trendburada.customer.application.InvalidCustomerProfileFieldException;
import com.trendburada.shared.ApiResponse;
import com.trendburada.shared.BusinessException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global mapping of selected exceptions to HTTP responses, wrapped in {@link ApiResponse} so
 * the body shape stays consistent with the rest of the API.
 *
 * <p>Mapping rules:
 * <ul>
 *   <li>{@link BusinessException} (and any subclass: {@code NotFoundException},
 *       {@code BadRequestException}, {@code ConflictException}, plus domain types like
 *       {@code AddressNotFoundException}) &rarr; the exception's declared HTTP status with
 *       the exception message in the body.</li>
 *   <li>{@link MethodArgumentNotValidException} &rarr; 400 with a {@code {field: message}} map
 *       in {@code data}.</li>
 *   <li>{@link InvalidCustomerProfileFieldException} &rarr; same 400 + {@code {field: message}}
 *       shape, so the FE's {@code extractFieldErrors} hook can unpack both without a special
 *       case.</li>
 *   <li>{@link IllegalArgumentException} &rarr; 400 with the message. Catches the generic guard
 *       clauses inside services without forcing every one of them to throw a typed exception.</li>
 * </ul>
 *
 * <p>Out of scope:
 * <ul>
 *   <li>No {@code @ExceptionHandler(Exception.class)} catch-all is defined: it would also
 *       intercept {@code AccessDeniedException} bubbling up from controllers and break Spring
 *       Security's {@code ExceptionTranslationFilter} chain. Anything not handled here falls
 *       through to Spring Boot's {@code /error} path, which is the same default the rest of
 *       the API has always relied on.</li>
 *   <li>{@code AccessDeniedException} is intentionally not handled here so Spring Security's
 *       {@code BearerTokenAccessDeniedHandler} keeps producing the 401/403 the cart and
 *       address endpoints already document.</li>
 *   <li>{@code AuthException} has its own controller-scoped handler in {@code AuthController}
 *       that returns the legacy {@code LegacyResponse} body shape; migrating it would be a
 *       FE-visible change and is tracked separately.</li>
 * </ul>
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException ex) {
        return ResponseEntity
                .status(ex.getHttpStatus())
                .body(new ApiResponse<>(false, null, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            // Last-write-wins is fine: clients only need one message per field to fix the input.
            fieldErrors.put(fieldError.getField(),
                    fieldError.getDefaultMessage() == null ? "invalid" : fieldError.getDefaultMessage());
        }
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, fieldErrors, "Validation failed"));
    }

    @ExceptionHandler(InvalidCustomerProfileFieldException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleInvalidProfileField(
            InvalidCustomerProfileFieldException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        fieldErrors.put(ex.getField(), ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, fieldErrors, "Validation failed"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, null, ex.getMessage()));
    }
}
