package com.trendburada.customer.application;

import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.customer.domain.CustomerRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CustomerQueryService {

    private final CustomerRepository customerRepository;

    public CustomerQueryService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public CustomerProfileSummary getProfile() {
        return customerRepository.findAll().stream()
                .findFirst()
                .map(this::map)
                .orElse(null);
    }

    public CustomerProfileSummary getProfileByEmail(String email) {
        return customerRepository.findByEmail(email)
                .map(this::map)
                .orElse(null);
    }

    public List<CustomerProfileSummary> getProfiles() {
        return customerRepository.findAll().stream().map(this::map).toList();
    }

    public CustomerProfileSummary create(CreateCustomerRequest request) {
        CustomerEntity entity = new CustomerEntity();
        entity.setCustomerCode("cust-" + System.currentTimeMillis());
        entity.setFullName(request.fullName());
        entity.setEmail(request.email());
        entity.setSegment(request.segment());
        entity.setPreferredCategory(request.preferredCategory());
        return map(customerRepository.save(entity));
    }

    private CustomerProfileSummary map(CustomerEntity entity) {
        return new CustomerProfileSummary(
                entity.getCustomerCode(),
                entity.getFullName(),
                entity.getEmail(),
                entity.getSegment(),
                entity.getPreferredCategory()
        );
    }
}
