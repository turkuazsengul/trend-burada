package com.trendburada.platform.api;

import com.trendburada.customer.application.CustomerProfileSummary;
import com.trendburada.customer.application.CustomerQueryService;
import com.trendburada.customer.application.CreateCustomerRequest;
import com.trendburada.shared.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer")
public class CustomerController {

    private final CustomerQueryService customerQueryService;

    public CustomerController(CustomerQueryService customerQueryService) {
        this.customerQueryService = customerQueryService;
    }

    @GetMapping("/profile")
    public ApiResponse<CustomerProfileSummary> profile(@RequestParam(required = false) String email) {
        return ApiResponse.ok(email == null ? customerQueryService.getProfile() : customerQueryService.getProfileByEmail(email));
    }

    @GetMapping("/profiles")
    public ApiResponse<List<CustomerProfileSummary>> profiles() {
        return ApiResponse.ok(customerQueryService.getProfiles());
    }

    @PostMapping("/profiles")
    public ApiResponse<CustomerProfileSummary> create(@RequestBody CreateCustomerRequest request) {
        return ApiResponse.ok(customerQueryService.create(request));
    }
}
