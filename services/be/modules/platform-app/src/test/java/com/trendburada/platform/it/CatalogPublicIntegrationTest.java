package com.trendburada.platform.it;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.context.annotation.Import;

/**
 * End-to-end smoke for the public catalog surface.
 *
 * <p>The catalog endpoints in {@code SecurityConfig} are explicitly listed under
 * {@code permitAll}, so this test does not authenticate; it proves that anonymous
 * traffic hits the controller, the service queries the Postgres Testcontainer, and
 * the response comes back as the expected {@code ApiResponse<PagedResult>} envelope
 * even when there are zero products in the database.
 *
 * <p>If this test breaks, the failure point is one of:
 * <ul>
 *   <li>SecurityConfig — someone moved {@code /api/v1/catalog/products} out of
 *       {@code permitAll}.</li>
 *   <li>The DB schema — Hibernate / Flyway / {@code init-schemas.sql} disagreement
 *       (e.g. after TB-04 takeover lands and a column type drifts from the entity).</li>
 *   <li>The {@code ApiResponse} envelope shape — a refactor changed
 *       {@code success} / {@code data} / {@code message} field names.</li>
 * </ul>
 */
@Import(IntegrationTestConfig.class)
@EnabledIfSystemProperty(named = "tests.integration", matches = "true")
class CatalogPublicIntegrationTest extends AbstractIntegrationTest {

    @Test
    void productsEndpointReturnsApiResponseEnvelope() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.totalElements").exists())
                .andExpect(jsonPath("$.data.page").value(0));
    }

    @Test
    void categoryTreeEndpointReturnsArrayInData() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/categories/tree"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }
}
