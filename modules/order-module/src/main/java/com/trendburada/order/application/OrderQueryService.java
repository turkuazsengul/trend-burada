package com.trendburada.order.application;

import com.trendburada.order.domain.OrderEntity;
import com.trendburada.order.domain.OrderRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OrderQueryService {

    private final OrderRepository orderRepository;

    public OrderQueryService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public List<OrderOverview> getRecentOrders(String customerCode) {
        List<OrderEntity> entities = customerCode == null || customerCode.isBlank()
                ? orderRepository.findAll()
                : orderRepository.findByCustomerCode(customerCode);
        return entities.stream().map(this::map).toList();
    }

    public OrderOverview create(CreateOrderRequest request) {
        OrderEntity entity = new OrderEntity();
        entity.setOrderCode("ord-" + System.currentTimeMillis());
        entity.setCustomerCode(request.customerCode());
        entity.setStatus(request.status());
        entity.setTotalAmount(request.totalAmount());
        return map(orderRepository.save(entity));
    }

    private OrderOverview map(OrderEntity entity) {
        return new OrderOverview(entity.getOrderCode(), entity.getStatus(), entity.getTotalAmount());
    }
}
