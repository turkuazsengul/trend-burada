package com.trendburada.customer.application;

import org.springframework.stereotype.Service;

@Service
public class CustomerQueryService {

    public CustomerProfileSummary getProfile() {
        return new CustomerProfileSummary(
                "cust-1001",
                "Demo Kullanici",
                "demo@trendburada.com",
                "LOYAL",
                "kadin"
        );
    }
}
