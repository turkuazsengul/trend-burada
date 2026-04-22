package com.trendburada.platform.api;

import com.trendburada.customer.application.CustomerProfileSummary;
import com.trendburada.customer.application.CustomerQueryService;
import com.trendburada.shared.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer")
public class CustomerController {

    private final CustomerQueryService customerQueryService;

    public CustomerController(CustomerQueryService customerQueryService) {
        this.customerQueryService = customerQueryService;
    }

    @GetMapping("/profile")
    public ApiResponse<CustomerProfileSummary> profile() {
        return ApiResponse.ok(customerQueryService.getProfile());
    }
}
