package com.trendburada.platform.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.trendburada.customer.application.AddressNotFoundException;
import com.trendburada.customer.application.AddressRequest;
import com.trendburada.customer.application.AddressService;
import com.trendburada.customer.application.AddressView;
import com.trendburada.customer.domain.CustomerEntity;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * Slice tests for {@link CustomerAddressController} that lock down the same security
 * properties enforced on the cart endpoints:
 * <ul>
 *   <li>The customer is taken from the JWT-resolved {@link CustomerEntity}, never from the
 *       request body, query string or path.</li>
 *   <li>Validation failures bubble up as 400 with field-level errors (via
 *       {@link ApiExceptionHandler}).</li>
 *   <li>Targeting another customer's address surfaces as 404, not 403, so existence is not
 *       leaked.</li>
 *   <li>An access-denied bubble from the resolver propagates (the security chain turns it
 *       into 403 in production).</li>
 * </ul>
 *
 * <p>Uses standalone {@link MockMvc} with the real {@link ApiExceptionHandler} wired in,
 * which is enough to exercise the 4xx contracts without booting the full Spring context.
 */
class CustomerAddressControllerTest {

    private AddressService addressService;
    private AuthenticatedCustomerResolver customerResolver;
    private MockMvc mockMvc;
    private Authentication testAuth;
    private CustomerEntity callerCustomer;

    @BeforeEach
    void setUp() throws Exception {
        addressService = mock(AddressService.class);
        customerResolver = mock(AuthenticatedCustomerResolver.class);

        callerCustomer = customerWithId(UUID.fromString("00000000-0000-0000-0000-000000000A11"));
        when(customerResolver.resolveCustomer(any(Authentication.class))).thenReturn(callerCustomer);

        CustomerAddressController controller =
                new CustomerAddressController(addressService, customerResolver);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();

        testAuth = testJwt();
    }

    @Test
    void list_returns_addresses_scoped_to_jwt_customer() throws Exception {
        when(addressService.listForCustomer(callerCustomer.getId()))
                .thenReturn(List.of(sampleView("Ev", true), sampleView("Is", false)));

        mockMvc.perform(get("/api/v1/customer/me/addresses").principal(testAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].title", is("Ev")));

        verify(addressService, times(1)).listForCustomer(callerCustomer.getId());
    }

    @Test
    void list_ignores_customer_id_query_param_supplied_by_client() throws Exception {
        when(addressService.listForCustomer(callerCustomer.getId())).thenReturn(List.of());

        // A malicious client tries to pivot to another customer by adding a query param.
        // The controller has no such parameter and resolves the id from the JWT, so the
        // query string is silently ignored. Verifying that the call still hits the
        // JWT-derived UUID is the assertion that matters.
        mockMvc.perform(get("/api/v1/customer/me/addresses")
                        .principal(testAuth)
                        .param("customerId", "ffffffff-ffff-ffff-ffff-ffffffffffff"))
                .andExpect(status().isOk());

        verify(addressService, times(1)).listForCustomer(callerCustomer.getId());
    }

    @Test
    void create_persists_with_jwt_customer_id_and_returns_201() throws Exception {
        AddressView created = sampleView("Ev", true);
        when(addressService.create(eq(callerCustomer.getId()), any(AddressRequest.class)))
                .thenReturn(created);

        String body = """
                {
                  "title": "Ev",
                  "fullName": "Ali Veli",
                  "phone": "+90 555 111 22 33",
                  "country": "Turkiye",
                  "city": "Istanbul",
                  "district": "Kadikoy",
                  "neighborhood": "Caferaga",
                  "addressLine": "Sahil yolu No:1",
                  "postalCode": "34710",
                  "isDefault": true
                }
                """;

        mockMvc.perform(post("/api/v1/customer/me/addresses")
                        .principal(testAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Ev")));

        ArgumentCaptor<AddressRequest> captor = ArgumentCaptor.forClass(AddressRequest.class);
        verify(addressService).create(eq(callerCustomer.getId()), captor.capture());
        AddressRequest passed = captor.getValue();
        assertThat(passed.title()).isEqualTo("Ev");
        assertThat(passed.isDefault()).isTrue();
    }

    @Test
    void create_returns_400_when_required_field_missing() throws Exception {
        // No title — should fail @NotBlank validation before ever hitting the service.
        String body = """
                {
                  "title": "",
                  "fullName": "Ali Veli",
                  "phone": "+90 555 111 22 33",
                  "country": "Turkiye",
                  "city": "Istanbul",
                  "district": "Kadikoy",
                  "addressLine": "Sahil yolu No:1",
                  "isDefault": false
                }
                """;

        mockMvc.perform(post("/api/v1/customer/me/addresses")
                        .principal(testAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.data.title").exists());

        verify(addressService, never()).create(any(), any());
    }

    @Test
    void create_returns_400_when_phone_format_is_invalid() throws Exception {
        String body = """
                {
                  "title": "Ev",
                  "fullName": "Ali Veli",
                  "phone": "abc",
                  "country": "Turkiye",
                  "city": "Istanbul",
                  "district": "Kadikoy",
                  "addressLine": "Sahil yolu No:1",
                  "isDefault": false
                }
                """;

        mockMvc.perform(post("/api/v1/customer/me/addresses")
                        .principal(testAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.phone").exists());

        verify(addressService, never()).create(any(), any());
    }

    @Test
    void update_uses_jwt_customer_id_and_path_id() throws Exception {
        UUID addressId = UUID.fromString("00000000-0000-0000-0000-000000000B22");
        AddressView updated = sampleView("Is", false);
        when(addressService.update(eq(callerCustomer.getId()), eq(addressId), any(AddressRequest.class)))
                .thenReturn(updated);

        String body = """
                {
                  "title": "Is",
                  "fullName": "Ali Veli",
                  "phone": "+90 555 111 22 33",
                  "country": "Turkiye",
                  "city": "Istanbul",
                  "district": "Besiktas",
                  "addressLine": "Buyukdere Cd. No:10",
                  "isDefault": false
                }
                """;

        mockMvc.perform(put("/api/v1/customer/me/addresses/{id}", addressId)
                        .principal(testAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Is")));

        verify(addressService).update(eq(callerCustomer.getId()), eq(addressId), any(AddressRequest.class));
    }

    @Test
    void update_returns_404_when_address_belongs_to_another_customer() throws Exception {
        UUID addressId = UUID.fromString("00000000-0000-0000-0000-000000000B22");
        when(addressService.update(eq(callerCustomer.getId()), eq(addressId), any(AddressRequest.class)))
                .thenThrow(new AddressNotFoundException(addressId));

        String body = """
                {
                  "title": "Is",
                  "fullName": "Ali Veli",
                  "phone": "+90 555 111 22 33",
                  "country": "Turkiye",
                  "city": "Istanbul",
                  "district": "Besiktas",
                  "addressLine": "Buyukdere Cd. No:10",
                  "isDefault": false
                }
                """;

        mockMvc.perform(put("/api/v1/customer/me/addresses/{id}", addressId)
                        .principal(testAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void delete_uses_jwt_customer_id_and_path_id_and_returns_204() throws Exception {
        UUID addressId = UUID.fromString("00000000-0000-0000-0000-000000000B22");

        mockMvc.perform(delete("/api/v1/customer/me/addresses/{id}", addressId).principal(testAuth))
                .andExpect(status().isNoContent());

        verify(addressService, times(1)).delete(callerCustomer.getId(), addressId);
    }

    @Test
    void delete_returns_404_when_address_belongs_to_another_customer() throws Exception {
        UUID addressId = UUID.fromString("00000000-0000-0000-0000-000000000B22");
        org.mockito.Mockito.doThrow(new AddressNotFoundException(addressId))
                .when(addressService).delete(callerCustomer.getId(), addressId);

        mockMvc.perform(delete("/api/v1/customer/me/addresses/{id}", addressId).principal(testAuth))
                .andExpect(status().isNotFound());
    }

    @Test
    void list_propagates_access_denied_from_resolver() {
        when(customerResolver.resolveCustomer(any(Authentication.class)))
                .thenThrow(new AccessDeniedException("no customer"));

        // Standalone MockMvc has no Spring Security ExceptionTranslationFilter, so the
        // exception bubbles out of perform(); in production it lands as HTTP 403 via
        // BearerTokenAccessDeniedHandler. Asserting on the raw exception keeps this test
        // honest about *what* the controller does (not what the surrounding chain does).
        assertThatThrownBy(() -> mockMvc.perform(get("/api/v1/customer/me/addresses").principal(testAuth)))
                .rootCause()
                .isInstanceOf(AccessDeniedException.class);
    }

    private static AddressView sampleView(String title, boolean isDefault) {
        Instant now = Instant.parse("2026-04-26T10:00:00Z");
        return new AddressView(
                UUID.randomUUID(),
                title,
                "Ali Veli",
                "+90 555 111 22 33",
                "Turkiye",
                "Istanbul",
                "Kadikoy",
                "Caferaga",
                "Sahil yolu No:1",
                "34710",
                isDefault,
                now,
                now
        );
    }

    /**
     * Constructs a {@link CustomerEntity} with a chosen id. The entity's id setter is
     * intentionally absent (id is generated by JPA), so we reflect it in for tests; this is
     * test-only code and acceptable.
     */
    private static CustomerEntity customerWithId(UUID id) throws Exception {
        CustomerEntity entity = new CustomerEntity();
        entity.setCustomerCode("cust-" + id.toString().substring(0, 8));
        entity.setEmail("user@example.com");
        entity.setFullName("Test User");
        entity.setSegment("standard");
        entity.setPreferredCategory("general");
        Field idField = CustomerEntity.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(entity, id);
        return entity;
    }

    private static Authentication testJwt() {
        HashMap<String, Object> headers = new HashMap<>();
        headers.put("alg", "none");
        HashMap<String, Object> claims = new HashMap<>();
        claims.put("sub", "kc-uuid-test");
        claims.put("email", "user@example.com");
        Jwt jwt = new Jwt("token-value", Instant.now(), Instant.now().plusSeconds(60), headers, claims);
        return new JwtAuthenticationToken(jwt, java.util.Collections.emptyList());
    }
}
