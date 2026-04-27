package com.trendburada.platform.api;

import com.trendburada.customer.application.CreateCustomerRequest;
import com.trendburada.customer.application.CustomerProfileSummary;
import com.trendburada.customer.application.CustomerProfileUpdateRequest;
import com.trendburada.customer.application.CustomerQueryService;
import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.shared.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Customer profile endpoints.
 *
 * <p>Two surfaces:
 * <ul>
 *   <li>The legacy debug-style endpoints ({@code /profile}, {@code /profiles},
 *       {@code POST /profiles}) which take an explicit email or no scoping at all.
 *       Used by admin tooling; left intact.</li>
 *   <li>The JWT-scoped self-service pair {@code GET|PATCH /me} that powers the FE profile
 *       page. The customer is resolved via {@link AuthenticatedCustomerResolver} so a
 *       caller can never pivot to another customer's data &mdash; mirrors the security
 *       posture of {@link CustomerAddressController}.</li>
 * </ul>
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

    @GetMapping("/profile")
    public ApiResponse<CustomerProfileSummary> profile(@RequestParam(required = false) String email) {
        return ApiResponse.ok(email == null ? customerQueryService.getProfile() : customerQueryService.getProfileByEmail(email));
    }

    @GetMapping("/profiles")
    public ApiResponse<List<CustomerProfileSummary>> profiles() {
        return ApiResponse.ok(customerQueryService.getProfiles());
    }

    @PostMapping("/profiles")
    public ApiResponse<CustomerProfileSummary> create(@RequestBody CreateCustomerRequest request) {
        return ApiResponse.ok(customerQueryService.create(request));
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
