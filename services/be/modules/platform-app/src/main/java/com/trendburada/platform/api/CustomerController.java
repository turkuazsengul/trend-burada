package com.trendburada.platform.api;

import com.trendburada.customer.application.CustomerProfileSummary;
import com.trendburada.customer.application.CustomerProfileUpdateRequest;
import com.trendburada.customer.application.CustomerQueryService;
import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.shared.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Customer self-service profile endpoints.
 *
 * <p>Exposes only the JWT-scoped {@code GET|PATCH /me} pair. The customer is resolved via
 * {@link AuthenticatedCustomerResolver} so a caller can never pivot to another customer's
 * data &mdash; mirrors the security posture of {@link CustomerAddressController}.
 *
 * <p>The previous {@code /profile}, {@code /profiles}, {@code POST /profiles} endpoints
 * were removed: they accepted an explicit email or no scoping at all, were guarded only by
 * {@code .anyRequest().authenticated()}, and therefore leaked PII (full name, email, phone,
 * birth date) to any signed-in user.
 */
@RestController
@RequestMapping("/api/v1/customer")
@Tag(name = "Customer Profile",
        description = "Authenticated customer's self-service profile (GET + PATCH). "
                + "Scoped to the JWT subject; no customer identifier is accepted on /me.")
public class CustomerController {

    private final CustomerQueryService customerQueryService;
    private final AuthenticatedCustomerResolver customerResolver;

    public CustomerController(CustomerQueryService customerQueryService,
                              AuthenticatedCustomerResolver customerResolver) {
        this.customerQueryService = customerQueryService;
        this.customerResolver = customerResolver;
    }

    @GetMapping("/me")
    @Operation(summary = "Read the caller's own profile",
            description = "Returns the profile of the customer resolved from the JWT. "
                    + "No identifier is accepted on the request; ownership is enforced by "
                    + "AuthenticatedCustomerResolver.")
    public ApiResponse<CustomerProfileSummary> me(Authentication authentication) {
        CustomerEntity caller = customerResolver.resolveCustomer(authentication);
        return ApiResponse.ok(customerQueryService.getMe(caller));
    }

    @PatchMapping("/me")
    @Operation(summary = "Partially update the caller's own profile",
            description = "Accepts any subset of {gender, birthDate, phone}. Null fields are "
                    + "left untouched. Identity fields (fullName, email) are immutable here "
                    + "and must go through the verified-email auth flow.")
    public ApiResponse<CustomerProfileSummary> updateMe(Authentication authentication,
                                                        @Valid @RequestBody CustomerProfileUpdateRequest request) {
        CustomerEntity caller = customerResolver.resolveCustomer(authentication);
        return ApiResponse.ok(customerQueryService.patchMe(caller, request));
    }
}
