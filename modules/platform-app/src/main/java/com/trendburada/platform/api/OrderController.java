package com.trendburada.platform.api;

import com.trendburada.order.application.CreateOrderRequest;
import com.trendburada.order.application.OrderOverview;
import com.trendburada.order.application.OrderQueryService;
import com.trendburada.shared.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderQueryService orderQueryService;

    public OrderController(OrderQueryService orderQueryService) {
        this.orderQueryService = orderQueryService;
    }

    @GetMapping
    public ApiResponse<List<OrderOverview>> recentOrders(@RequestParam(required = false) String customerCode) {
        return ApiResponse.ok(orderQueryService.getRecentOrders(customerCode));
    }

    @PostMapping
    public ApiResponse<OrderOverview> create(@RequestBody CreateOrderRequest request) {
        return ApiResponse.ok(orderQueryService.create(request));
    }
}
