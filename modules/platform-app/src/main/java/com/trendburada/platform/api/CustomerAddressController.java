package com.trendburada.platform.api;

import com.trendburada.customer.application.AddressRequest;
import com.trendburada.customer.application.AddressService;
import com.trendburada.customer.application.AddressView;
import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.shared.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * CRUD endpoints for the authenticated customer's saved addresses.
 *
 * <p>Ownership is JWT-derived: the customer is resolved via
 * {@link AuthenticatedCustomerResolver} on every request, and the resolved UUID is the only
 * way an address can be reached. There is no {@code customerCode} (or {@code customerId})
 * path / query / body parameter on any endpoint here &mdash; that is by design, mirroring the
 * cart endpoints' security posture so a malicious client cannot pivot to another customer's
 * data by tampering with the request.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>{@code GET    /api/v1/customer/me/addresses}        &mdash; list all of the caller's addresses</li>
 *   <li>{@code POST   /api/v1/customer/me/addresses}        &mdash; create a new address; returns 201</li>
 *   <li>{@code PUT    /api/v1/customer/me/addresses/{id}}   &mdash; full replace an existing address</li>
 *   <li>{@code DELETE /api/v1/customer/me/addresses/{id}}   &mdash; remove an address; returns 204</li>
 * </ul>
 *
 * <p>Mismatched / unknown {@code id}s surface as 404, not 403, so we don't reveal the
 * existence of other customers' address rows.
 */
@RestController
@RequestMapping("/api/v1/customer/me/addresses")
@Tag(name = "Customer Addresses",
        description = "Authenticated customer's saved delivery / mailing addresses. "
                + "Scoped to the JWT subject; no customer identifier is accepted on any request.")
public class CustomerAddressController {

    private final AddressService addressService;
    private final AuthenticatedCustomerResolver customerResolver;

    public CustomerAddressController(AddressService addressService,
                                     AuthenticatedCustomerResolver customerResolver) {
        this.addressService = addressService;
        this.customerResolver = customerResolver;
    }

    @GetMapping
    @Operation(summary = "List the caller's addresses",
            description = "Returns the addresses owned by the authenticated customer, "
                    + "ordered with the default address first then by creation time descending.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200", description = "Addresses returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401", description = "Missing or invalid JWT", content = @io.swagger.v3.oas.annotations.media.Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403", description = "JWT carries no trusted email claim or no customer is linked to it",
                    content = @io.swagger.v3.oas.annotations.media.Content)
    })
    public ApiResponse<List<AddressView>> list(Authentication authentication) {
        CustomerEntity customer = customerResolver.resolveCustomer(authentication);
        return ApiResponse.ok(addressService.listForCustomer(customer.getId()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create an address for the caller",
            description = "Persists a new address for the authenticated customer. "
                    + "If isDefault=true, any other default for this customer is cleared in the same transaction.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201", description = "Address created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400", description = "Validation failed (missing required field, bad phone format, etc.)",
                    content = @io.swagger.v3.oas.annotations.media.Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401", description = "Missing or invalid JWT", content = @io.swagger.v3.oas.annotations.media.Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403", description = "JWT carries no trusted email claim or no customer is linked to it",
                    content = @io.swagger.v3.oas.annotations.media.Content)
    })
    public ApiResponse<AddressView> create(Authentication authentication,
                                           @Valid @RequestBody AddressRequest request) {
        CustomerEntity customer = customerResolver.resolveCustomer(authentication);
        return ApiResponse.ok(addressService.create(customer.getId(), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Replace an existing address",
            description = "Full-replace semantics: every field on the body overwrites the stored address. "
                    + "Returns 404 if the id does not belong to the authenticated customer.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200", description = "Address replaced"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400", description = "Validation failed", content = @io.swagger.v3.oas.annotations.media.Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401", description = "Missing or invalid JWT", content = @io.swagger.v3.oas.annotations.media.Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403", description = "JWT carries no trusted email claim or no customer is linked to it",
                    content = @io.swagger.v3.oas.annotations.media.Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404", description = "No such address for this customer",
                    content = @io.swagger.v3.oas.annotations.media.Content)
    })
    public ApiResponse<AddressView> update(Authentication authentication,
                                           @PathVariable UUID id,
                                           @Valid @RequestBody AddressRequest request) {
        CustomerEntity customer = customerResolver.resolveCustomer(authentication);
        return ApiResponse.ok(addressService.update(customer.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete an address",
            description = "Hard-deletes the address. Returns 404 if the id does not belong to the authenticated customer.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "204", description = "Address deleted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401", description = "Missing or invalid JWT", content = @io.swagger.v3.oas.annotations.media.Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403", description = "JWT carries no trusted email claim or no customer is linked to it",
                    content = @io.swagger.v3.oas.annotations.media.Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404", description = "No such address for this customer",
                    content = @io.swagger.v3.oas.annotations.media.Content)
    })
    public void delete(Authentication authentication, @PathVariable UUID id) {
        CustomerEntity customer = customerResolver.resolveCustomer(authentication);
        addressService.delete(customer.getId(), id);
    }
}
