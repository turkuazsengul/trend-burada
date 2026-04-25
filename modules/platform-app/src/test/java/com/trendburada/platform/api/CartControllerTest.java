package com.trendburada.platform.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.trendburada.cart.application.CartItemView;
import com.trendburada.cart.application.CartPreview;
import com.trendburada.cart.application.CartQueryService;
import com.trendburada.cart.application.CreateCartItemRequest;
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
 * Slice tests proving cart endpoints are scoped to the JWT-derived customerCode and that any
 * customerCode supplied by the client is ignored.
 *
 * <p>Uses standalone {@link MockMvc} so we don't need the full Spring context (Keycloak/DB
 * wiring). Spring Security's filter chain is also out of scope here; the resolver's own 403
 * behavior is covered by {@link AuthenticatedCustomerResolverTest}.
 *
 * <p>The {@link Authentication} parameter on the controller is populated via
 * {@code request.getUserPrincipal()} (Spring's {@code ServletRequestMethodArgumentResolver}),
 * so each request sets it explicitly with {@code .principal(...)}.
 */
class CartControllerTest {

    private CartQueryService cartQueryService;
    private AuthenticatedCustomerResolver customerResolver;
    private MockMvc mockMvc;
    private Authentication testAuth;

    @BeforeEach
    void setUp() {
        cartQueryService = mock(CartQueryService.class);
        customerResolver = mock(AuthenticatedCustomerResolver.class);
        CartController controller = new CartController(cartQueryService, customerResolver);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        testAuth = testJwt();
    }

    @Test
    void preview_uses_customer_code_resolved_from_authentication() throws Exception {
        when(customerResolver.resolveCustomerCode(any(Authentication.class))).thenReturn("cust-A");
        when(cartQueryService.getPreview("cust-A")).thenReturn(new CartPreview(2, 100.0, 39.9, 0.0, 139.9));

        mockMvc.perform(get("/api/v1/cart/preview").principal(testAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.itemCount", is(2)));

        verify(cartQueryService, times(1)).getPreview("cust-A");
    }

    @Test
    void preview_ignores_customer_code_query_param_supplied_by_client() throws Exception {
        when(customerResolver.resolveCustomerCode(any(Authentication.class))).thenReturn("cust-A");
        when(cartQueryService.getPreview("cust-A")).thenReturn(new CartPreview(0, 0, 0, 0, 0));

        // Client tries to fetch another user's cart by passing customerCode=cust-B; we ignore it.
        mockMvc.perform(get("/api/v1/cart/preview").principal(testAuth).param("customerCode", "cust-B"))
                .andExpect(status().isOk());

        verify(cartQueryService, times(1)).getPreview("cust-A");
    }

    @Test
    void items_uses_customer_code_resolved_from_authentication() throws Exception {
        when(customerResolver.resolveCustomerCode(any(Authentication.class))).thenReturn("cust-A");
        when(cartQueryService.getItems("cust-A")).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/cart/items").principal(testAuth))
                .andExpect(status().isOk());

        verify(cartQueryService, times(1)).getItems("cust-A");
    }

    @Test
    void add_item_overrides_body_customer_code_with_resolved_value() throws Exception {
        when(customerResolver.resolveCustomerCode(any(Authentication.class))).thenReturn("cust-A");
        when(cartQueryService.addItem(any(CreateCartItemRequest.class)))
                .thenReturn(new CartItemView(UUID.randomUUID(), "cart-A", "prd-1", 1, 49.9));

        // Attacker tries to write into cust-B's cart.
        String body = "{\"customerCode\":\"cust-B\",\"productCode\":\"prd-1\",\"quantity\":1,\"unitPrice\":49.9}";

        mockMvc.perform(post("/api/v1/cart/items")
                        .principal(testAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        ArgumentCaptor<CreateCartItemRequest> captor = ArgumentCaptor.forClass(CreateCartItemRequest.class);
        verify(cartQueryService).addItem(captor.capture());
        CreateCartItemRequest passed = captor.getValue();
        // Body said cust-B; the server must have replaced it with cust-A.
        assertThat(passed.customerCode()).isEqualTo("cust-A");
        assertThat(passed.productCode()).isEqualTo("prd-1");
        assertThat(passed.quantity()).isEqualTo(1);
    }

    @Test
    void preview_propagates_access_denied_from_resolver() {
        when(customerResolver.resolveCustomerCode(any(Authentication.class)))
                .thenThrow(new AccessDeniedException("no customer"));

        // Standalone MockMvc has no Spring Security ExceptionTranslationFilter, so the
        // exception bubbles out of perform(). In production it becomes HTTP 403 via the
        // security chain (BearerTokenAccessDeniedHandler).
        assertThatThrownBy(() -> mockMvc.perform(get("/api/v1/cart/preview").principal(testAuth)))
                .rootCause()
                .isInstanceOf(AccessDeniedException.class);
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
