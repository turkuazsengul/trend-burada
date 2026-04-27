package com.trendburada.customer.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.customer.domain.CustomerRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for the JWT-scoped self-service profile flow on
 * {@link CustomerQueryService}: {@code getMe} and {@code patchMe}.
 *
 * <p>The legacy debug methods ({@code getProfile / getProfiles / create}) are not retested
 * here &mdash; their behaviour didn't change in this iteration. These tests are focused on
 * the new partial-update semantics + value normalisation that powers
 * {@code PATCH /api/v1/customer/me}.
 */
class CustomerQueryServiceMeTest {

    private CustomerRepository customerRepository;
    private CustomerQueryService service;

    @BeforeEach
    void setUp() {
        customerRepository = mock(CustomerRepository.class);
        service = new CustomerQueryService(customerRepository);
        // Echo back whatever we save so the returned summary reflects post-update state.
        when(customerRepository.save(any(CustomerEntity.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void get_me_returns_summary_built_from_caller_entity_without_extra_db_round_trip() {
        CustomerEntity caller = sampleCaller();
        caller.setGender("FEMALE");
        caller.setBirthDate(LocalDate.of(1990, 5, 14));
        caller.setPhone("+90 555 111 22 33");

        CustomerProfileSummary summary = service.getMe(caller);

        assertThat(summary.customerId()).isEqualTo(caller.getCustomerCode());
        assertThat(summary.email()).isEqualTo(caller.getEmail());
        assertThat(summary.gender()).isEqualTo("FEMALE");
        // birthDate is serialised as ISO yyyy-MM-dd string at the contract boundary.
        assertThat(summary.birthDate()).isEqualTo("1990-05-14");
        assertThat(summary.phone()).isEqualTo("+90 555 111 22 33");

        // getMe must not hit the repository — the controller already loaded the entity.
        verify(customerRepository, never()).findByEmail(any());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void get_me_rejects_null_caller() {
        assertThatThrownBy(() -> service.getMe(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void patch_me_with_null_request_is_a_noop_and_returns_current_state() {
        // PATCH with no body shouldn't be an error — it's a degenerate but valid request that
        // lets the FE round-trip the current state without writing.
        CustomerEntity caller = sampleCaller();
        caller.setPhone("+90 555 111 22 33");

        CustomerProfileSummary result = service.patchMe(caller, null);

        assertThat(result.phone()).isEqualTo("+90 555 111 22 33");
        verify(customerRepository, never()).save(any());
    }

    @Test
    void patch_me_skips_null_fields_and_only_writes_provided_ones() {
        CustomerEntity caller = sampleCaller();
        caller.setGender("MALE");
        caller.setBirthDate(LocalDate.of(1985, 1, 1));
        caller.setPhone("+90 111 111 11 11");

        // Only phone provided — gender + birthDate must be untouched.
        CustomerProfileUpdateRequest request =
                new CustomerProfileUpdateRequest(null, null, "+90 555 222 33 44");
        CustomerProfileSummary result = service.patchMe(caller, request);

        assertThat(caller.getGender()).isEqualTo("MALE");
        assertThat(caller.getBirthDate()).isEqualTo(LocalDate.of(1985, 1, 1));
        assertThat(caller.getPhone()).isEqualTo("+90 555 222 33 44");
        assertThat(result.phone()).isEqualTo("+90 555 222 33 44");
        verify(customerRepository, times(1)).save(caller);
    }

    @Test
    void patch_me_normalises_lowercase_gender_to_uppercase_before_persisting() {
        CustomerEntity caller = sampleCaller();
        // FE sends lowercase per the existing genderToServer helper.
        CustomerProfileUpdateRequest request =
                new CustomerProfileUpdateRequest("female", null, null);

        CustomerProfileSummary result = service.patchMe(caller, request);

        assertThat(caller.getGender()).isEqualTo("FEMALE");
        assertThat(result.gender()).isEqualTo("FEMALE");
    }

    @Test
    void patch_me_accepts_unspecified_as_a_first_class_value() {
        CustomerEntity caller = sampleCaller();
        caller.setGender("MALE");
        CustomerProfileUpdateRequest request =
                new CustomerProfileUpdateRequest("UNSPECIFIED", null, null);

        service.patchMe(caller, request);

        assertThat(caller.getGender()).isEqualTo("UNSPECIFIED");
    }

    @Test
    void patch_me_parses_iso_birth_date_to_local_date() {
        CustomerEntity caller = sampleCaller();
        CustomerProfileUpdateRequest request =
                new CustomerProfileUpdateRequest(null, "2000-12-31", null);

        CustomerProfileSummary result = service.patchMe(caller, request);

        assertThat(caller.getBirthDate()).isEqualTo(LocalDate.of(2000, 12, 31));
        assertThat(result.birthDate()).isEqualTo("2000-12-31");
    }

    @Test
    void patch_me_rejects_calendar_impossible_date_with_field_scoped_400() {
        // Feb 31 passes the regex but LocalDate.parse refuses it. Surfacing as
        // InvalidCustomerProfileFieldException keeps the FE's extractFieldErrors hook happy.
        CustomerEntity caller = sampleCaller();
        CustomerProfileUpdateRequest request =
                new CustomerProfileUpdateRequest(null, "2026-02-31", null);

        assertThatThrownBy(() -> service.patchMe(caller, request))
                .isInstanceOfSatisfying(InvalidCustomerProfileFieldException.class, ex -> {
                    assertThat(ex.getField()).isEqualTo("birthDate");
                });
        verify(customerRepository, never()).save(any());
    }

    @Test
    void patch_me_rejects_unknown_gender_token() {
        // Defence-in-depth: regex on the DTO would normally catch this, but the service must
        // also enforce it for callers that bypass bean validation (admin scripts, future
        // GraphQL surface). The exception is the same shape as the calendar-date case so the
        // 400 contract stays uniform.
        CustomerEntity caller = sampleCaller();
        CustomerProfileUpdateRequest request =
                new CustomerProfileUpdateRequest("alien", null, null);

        assertThatThrownBy(() -> service.patchMe(caller, request))
                .isInstanceOfSatisfying(InvalidCustomerProfileFieldException.class, ex -> {
                    assertThat(ex.getField()).isEqualTo("gender");
                });
        verify(customerRepository, never()).save(any());
    }

    @Test
    void patch_me_trims_whitespace_around_phone_and_birth_date() {
        CustomerEntity caller = sampleCaller();
        CustomerProfileUpdateRequest request =
                new CustomerProfileUpdateRequest(null, "  1990-05-14  ", "  +90 555 111 22 33  ");

        service.patchMe(caller, request);

        assertThat(caller.getBirthDate()).isEqualTo(LocalDate.of(1990, 5, 14));
        assertThat(caller.getPhone()).isEqualTo("+90 555 111 22 33");
    }

    @Test
    void patch_me_rejects_null_caller() {
        assertThatThrownBy(() -> service.patchMe(null,
                new CustomerProfileUpdateRequest(null, null, "+90 555 111 22 33")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private static CustomerEntity sampleCaller() {
        CustomerEntity entity = new CustomerEntity();
        entity.setCustomerCode("cust-1001");
        entity.setEmail("user@example.com");
        entity.setFullName("Test User");
        entity.setSegment("standard");
        entity.setPreferredCategory("general");
        return entity;
    }
}
