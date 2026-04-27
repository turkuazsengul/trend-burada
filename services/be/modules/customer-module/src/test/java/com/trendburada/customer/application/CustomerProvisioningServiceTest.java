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
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;

/**
 * Pure-unit coverage for {@link CustomerProvisioningService}. The contract under test:
 * <ul>
 *   <li>Existing rows are returned without re-saving (no clobber of locally-edited fields).</li>
 *   <li>New rows are created with sane defaults and the normalized (trimmed, lower-cased) email.</li>
 *   <li>Concurrent inserts that race past the unique-email constraint resolve by re-reading
 *       the row the other thread won, instead of bubbling up.</li>
 *   <li>Missing/blank email is rejected up front so we never write a row with no identity.</li>
 * </ul>
 */
class CustomerProvisioningServiceTest {

    private final CustomerRepository customerRepository = mock(CustomerRepository.class);
    private final CustomerProvisioningService service = new CustomerProvisioningService(customerRepository);

    @Test
    void returns_existing_row_without_re_saving_so_local_edits_are_preserved() {
        CustomerEntity existing = sampleCustomer("user@example.com", "Local Name");
        when(customerRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existing));

        CustomerEntity result = service.ensureCustomer("user@example.com", "From Keycloak");

        assertThat(result).isSameAs(existing);
        // Critical: do NOT save / overwrite. Profile may have been edited locally after the
        // initial provision and we don't want IdP-side renames to clobber that.
        verify(customerRepository, never()).save(any());
        verify(customerRepository, never()).saveAndFlush(any());
    }

    @Test
    void creates_new_row_when_no_match_with_normalized_email_and_defaults() {
        when(customerRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());
        when(customerRepository.saveAndFlush(any(CustomerEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        // Caller passes a messy email; we expect normalization (trim + lower).
        service.ensureCustomer("  USER@example.com  ", "Ali Veli");

        ArgumentCaptor<CustomerEntity> captor = ArgumentCaptor.forClass(CustomerEntity.class);
        verify(customerRepository, times(1)).saveAndFlush(captor.capture());
        CustomerEntity saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("user@example.com");
        assertThat(saved.getFullName()).isEqualTo("Ali Veli");
        assertThat(saved.getSegment()).isEqualTo("standard");
        assertThat(saved.getPreferredCategory()).isEqualTo("general");
        assertThat(saved.getCustomerCode()).startsWith("cust-");
    }

    @Test
    void falls_back_to_email_when_full_name_is_blank() {
        when(customerRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());
        when(customerRepository.saveAndFlush(any(CustomerEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        service.ensureCustomer("user@example.com", "   ");

        ArgumentCaptor<CustomerEntity> captor = ArgumentCaptor.forClass(CustomerEntity.class);
        verify(customerRepository).saveAndFlush(captor.capture());
        // Better than persisting whitespace: gives downstream code a non-empty display value
        // even if the IdP gave us a blank name.
        assertThat(captor.getValue().getFullName()).isEqualTo("user@example.com");
    }

    @Test
    void resolves_unique_violation_race_by_re_reading_winning_row() {
        // First findByEmail (existence check): empty → we attempt insert.
        // Insert: another thread already won → DataIntegrityViolationException.
        // Second findByEmail (fallback): returns the winning row.
        CustomerEntity winningRow = sampleCustomer("user@example.com", "Winner");
        when(customerRepository.findByEmail("user@example.com"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(winningRow));
        when(customerRepository.saveAndFlush(any(CustomerEntity.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key"));

        CustomerEntity result = service.ensureCustomer("user@example.com", "Loser");

        assertThat(result).isSameAs(winningRow);
    }

    @Test
    void rethrows_unique_violation_when_re_read_still_finds_nothing() {
        // Pathological case: integrity violation but no row when we re-read. Surfacing the
        // original exception is correct — something is genuinely wrong with the DB state.
        when(customerRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());
        when(customerRepository.saveAndFlush(any(CustomerEntity.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key"));

        assertThatThrownBy(() -> service.ensureCustomer("user@example.com", "Anyone"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejects_null_or_blank_email_early() {
        assertThatThrownBy(() -> service.ensureCustomer(null, "x"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.ensureCustomer("   ", "x"))
                .isInstanceOf(IllegalArgumentException.class);

        verify(customerRepository, never()).findByEmail(any());
    }

    private static CustomerEntity sampleCustomer(String email, String fullName) {
        CustomerEntity entity = new CustomerEntity();
        entity.setCustomerCode("cust-existing");
        entity.setEmail(email);
        entity.setFullName(fullName);
        entity.setSegment("standard");
        entity.setPreferredCategory("general");
        return entity;
    }
}
