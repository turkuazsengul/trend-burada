package com.trendburada.platform.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.trendburada.customer.application.CustomerProfileSummary;
import com.trendburada.customer.application.CustomerProfileUpdateRequest;
import com.trendburada.customer.application.CustomerQueryService;
import com.trendburada.customer.application.InvalidCustomerProfileFieldException;
import com.trendburada.customer.domain.CustomerEntity;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.HashMap;
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
 * Slice tests for the JWT-scoped {@code GET|PATCH /api/v1/customer/me} endpoints on
 * {@link CustomerController}. Mirrors the security-focused style of
 * {@link CustomerAddressControllerTest}:
 * <ul>
 *   <li>The customer is taken from the JWT-resolved {@link CustomerEntity}, never from the
 *       request body / query / path.</li>
 *   <li>Validation failures bubble up as 400 with field-level errors via
 *       {@link ApiExceptionHandler} &mdash; same body shape for bean-validation failures and
 *       runtime {@link InvalidCustomerProfileFieldException}s, so the FE
 *       {@code extractFieldErrors} hook needs no special case.</li>
 *   <li>An access-denied bubble from the resolver propagates (the production security chain
 *       maps it to 403).</li>
 * </ul>
 */
class CustomerControllerMeTest {

    private CustomerQueryService customerQueryService;
    private AuthenticatedCustomerResolver customerResolver;
    private MockMvc mockMvc;
    private Authentication testAuth;
    private CustomerEntity callerCustomer;

    @BeforeEach
    void setUp() throws Exception {
        customerQueryService = mock(CustomerQueryService.class);
        customerResolver = mock(AuthenticatedCustomerResolver.class);

        callerCustomer = customerWithId(UUID.fromString("00000000-0000-0000-0000-000000000A11"));
        when(customerResolver.resolveCustomer(any(Authentication.class))).thenReturn(callerCustomer);

        CustomerController controller = new CustomerController(customerQueryService, customerResolver);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();

        testAuth = testJwt();
    }

    @Test
    void get_me_returns_summary_built_from_jwt_resolved_customer() throws Exception {
        when(customerQueryService.getMe(callerCustomer))
                .thenReturn(sampleSummary("FEMALE", "1990-05-14", "+90 555 111 22 33"));

        mockMvc.perform(get("/api/v1/customer/me").principal(testAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.customerId", is("cust-1001")))
                .andExpect(jsonPath("$.data.email", is("user@example.com")))
                .andExpect(jsonPath("$.data.gender", is("FEMALE")))
                .andExpect(jsonPath("$.data.birthDate", is("1990-05-14")))
                .andExpect(jsonPath("$.data.phone", is("+90 555 111 22 33")));

        verify(customerQueryService, times(1)).getMe(callerCustomer);
    }

    @Test
    void get_me_renders_unset_optional_fields_as_null() throws Exception {
        // Freshly provisioned customers have no gender / birthDate / phone yet.
        when(customerQueryService.getMe(callerCustomer))
                .thenReturn(sampleSummary(null, null, null));

        mockMvc.perform(get("/api/v1/customer/me").principal(testAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.gender", is(nullValue())))
                .andExpect(jsonPath("$.data.birthDate", is(nullValue())))
                .andExpect(jsonPath("$.data.phone", is(nullValue())));
    }

    @Test
    void get_me_ignores_email_query_param_supplied_by_client() throws Exception {
        // A malicious client tries to read another customer's profile by adding ?email=.
        // /me has no such parameter; the resolver-derived caller is the only source of identity.
        when(customerQueryService.getMe(callerCustomer))
                .thenReturn(sampleSummary(null, null, null));

        mockMvc.perform(get("/api/v1/customer/me")
                        .principal(testAuth)
                        .param("email", "victim@example.com"))
                .andExpect(status().isOk());

        verify(customerQueryService, times(1)).getMe(callerCustomer);
    }

    @Test
    void patch_me_persists_via_service_and_returns_updated_summary() throws Exception {
        when(customerQueryService.patchMe(eq(callerCustomer), any(CustomerProfileUpdateRequest.class)))
                .thenReturn(sampleSummary("MALE", "1985-01-01", "+90 555 222 33 44"));

        String body = """
                {
                  "gender": "male",
                  "birthDate": "1985-01-01",
                  "phone": "+90 555 222 33 44"
                }
                """;

        mockMvc.perform(patch("/api/v1/customer/me")
                        .principal(testAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.gender", is("MALE")))
                .andExpect(jsonPath("$.data.phone", is("+90 555 222 33 44")));

        ArgumentCaptor<CustomerProfileUpdateRequest> captor =
                ArgumentCaptor.forClass(CustomerProfileUpdateRequest.class);
        verify(customerQueryService).patchMe(eq(callerCustomer), captor.capture());
        CustomerProfileUpdateRequest passed = captor.getValue();
        // Controller hands the raw request through; normalisation happens in the service so
        // capturing here lets us assert the wire shape didn't get rewritten on the way in.
        assertThat(passed.gender()).isEqualTo("male");
        assertThat(passed.birthDate()).isEqualTo("1985-01-01");
        assertThat(passed.phone()).isEqualTo("+90 555 222 33 44");
    }

    @Test
    void patch_me_accepts_partial_body_and_does_not_require_all_fields() throws Exception {
        // FE's "approve OTP" path sends only { phone: "..." }. Verifying we don't reject this
        // is the gating contract — without it, the OTP flow would 400 every time.
        when(customerQueryService.patchMe(eq(callerCustomer), any(CustomerProfileUpdateRequest.class)))
                .thenReturn(sampleSummary(null, null, "+90 555 999 88 77"));

        String body = """
                { "phone": "+90 555 999 88 77" }
                """;

        mockMvc.perform(patch("/api/v1/customer/me")
                        .principal(testAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.phone", is("+90 555 999 88 77")));
    }

    @Test
    void patch_me_returns_400_when_phone_format_is_invalid() throws Exception {
        // Bean-validation rejects bad phone before the service runs. ApiExceptionHandler turns
        // it into the {field: message} body the FE's extractFieldErrors hook expects.
        String body = """
                { "phone": "abc" }
                """;

        mockMvc.perform(patch("/api/v1/customer/me")
                        .principal(testAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.data.phone").exists());

        verify(customerQueryService, never()).patchMe(any(), any());
    }

    @Test
    void patch_me_returns_400_when_gender_is_unknown_token() throws Exception {
        String body = """
                { "gender": "alien" }
                """;

        mockMvc.perform(patch("/api/v1/customer/me")
                        .principal(testAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.gender").exists());

        verify(customerQueryService, never()).patchMe(any(), any());
    }

    @Test
    void patch_me_returns_400_when_birth_date_is_calendar_impossible() throws Exception {
        // Feb 31 passes the regex but the service throws InvalidCustomerProfileFieldException
        // which the handler maps to the same field-scoped 400 shape. This is the test that
        // ties the runtime check to the wire contract.
        String body = """
                { "birthDate": "2026-02-31" }
                """;
        when(customerQueryService.patchMe(eq(callerCustomer), any(CustomerProfileUpdateRequest.class)))
                .thenThrow(new InvalidCustomerProfileFieldException(
                        "birthDate", "birthDate is not a valid calendar date"));

        mockMvc.perform(patch("/api/v1/customer/me")
                        .principal(testAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.birthDate").exists());
    }

    @Test
    void patch_me_does_not_accept_email_or_full_name_overrides_from_body() throws Exception {
        // Identity fields (fullName, email) are intentionally absent from
        // CustomerProfileUpdateRequest. Jackson must drop unknown properties so a malicious
        // client cannot pivot them through. The captured DTO has nothing populated.
        when(customerQueryService.patchMe(eq(callerCustomer), any(CustomerProfileUpdateRequest.class)))
                .thenReturn(sampleSummary(null, null, null));

        String body = """
                {
                  "fullName": "Hijack Attempt",
                  "email": "attacker@example.com",
                  "customerCode": "cust-9999"
                }
                """;

        mockMvc.perform(patch("/api/v1/customer/me")
                        .principal(testAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        ArgumentCaptor<CustomerProfileUpdateRequest> captor =
                ArgumentCaptor.forClass(CustomerProfileUpdateRequest.class);
        verify(customerQueryService).patchMe(eq(callerCustomer), captor.capture());
        CustomerProfileUpdateRequest passed = captor.getValue();
        assertThat(passed.gender()).isNull();
        assertThat(passed.birthDate()).isNull();
        assertThat(passed.phone()).isNull();
    }

    @Test
    void me_propagates_access_denied_from_resolver() {
        when(customerResolver.resolveCustomer(any(Authentication.class)))
                .thenThrow(new AccessDeniedException("no customer"));

        // Same convention as CustomerAddressControllerTest: standalone MockMvc has no
        // ExceptionTranslationFilter, so the exception bubbles out of perform(). Production
        // turns this into HTTP 403 via BearerTokenAccessDeniedHandler.
        assertThatThrownBy(() -> mockMvc.perform(get("/api/v1/customer/me").principal(testAuth)))
                .rootCause()
                .isInstanceOf(AccessDeniedException.class);
    }

    private static CustomerProfileSummary sampleSummary(String gender, String birthDate, String phone) {
        return new CustomerProfileSummary(
                "cust-1001",
                "Test User",
                "user@example.com",
                "standard",
                "general",
                gender,
                birthDate,
                phone
        );
    }

    private static CustomerEntity customerWithId(UUID id) throws Exception {
        CustomerEntity entity = new CustomerEntity();
        entity.setCustomerCode("cust-1001");
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
