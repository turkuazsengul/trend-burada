package com.trendburada.order.application;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OrderQueryService {

    public List<OrderOverview> getRecentOrders() {
        return List.of(
                new OrderOverview("ord-20260422-1", "SHIPPED", 2750.50),
                new OrderOverview("ord-20260418-2", "DELIVERED", 1499.90)
        );
    }
}
