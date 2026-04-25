package com.trendburada.platform.api;

import com.trendburada.customer.application.AddressNotFoundException;
import com.trendburada.shared.ApiResponse;
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
 * <p>Intentionally narrow scope: only the handlers needed to back the address controller's
 * documented contracts (404 / 400) live here. {@code AccessDeniedException} is left to
 * Spring Security's {@code BearerTokenAccessDeniedHandler} so the existing cart endpoints
 * keep behaving exactly as before.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(AddressNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleAddressNotFound(AddressNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
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
}
