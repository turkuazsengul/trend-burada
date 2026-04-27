package com.trendburada.order.application;

import com.trendburada.order.domain.OrderEntity;
import com.trendburada.order.domain.OrderRepository;
import com.trendburada.shared.PagedResult;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class OrderQueryService {

    private final OrderRepository orderRepository;

    public OrderQueryService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public PagedResult<OrderOverview> getRecentOrders(String customerCode, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                normalizeSize(size),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        Page<OrderEntity> entities = customerCode == null || customerCode.isBlank()
                ? orderRepository.findAll(pageable)
                : orderRepository.findByCustomerCode(customerCode, pageable);
        Page<OrderOverview> mappedPage = entities.map(this::map);
        return PagedResult.of(
                mappedPage.getContent(),
                mappedPage.getTotalElements(),
                mappedPage.getNumber(),
                mappedPage.getSize(),
                mappedPage.getTotalPages(),
                mappedPage.hasNext()
        );
    }

    public OrderOverview create(CreateOrderRequest request) {
        OrderEntity entity = new OrderEntity();
        entity.setOrderCode("ord-" + System.currentTimeMillis());
        entity.setCustomerCode(request.customerCode());
        entity.setStatus(request.status());
        entity.setTotalAmount(request.totalAmount());
        entity.setCreatedAt(OffsetDateTime.now());
        return map(orderRepository.save(entity));
    }

    private OrderOverview map(OrderEntity entity) {
        return new OrderOverview(entity.getOrderCode(), entity.getStatus(), entity.getTotalAmount());
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return 10;
        }
        return Math.min(size, 50);
    }
}
