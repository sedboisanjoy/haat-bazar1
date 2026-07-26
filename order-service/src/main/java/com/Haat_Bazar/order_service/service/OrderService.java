package com.Haat_Bazar.order_service.service;

import com.Haat_Bazar.order_service.dto.CheckoutRequest;
import com.Haat_Bazar.order_service.dto.OrderItemResponse;
import com.Haat_Bazar.order_service.dto.OrderResponse;
import com.Haat_Bazar.order_service.dto.SellerSalesResponse;
import com.Haat_Bazar.order_service.exception.InsufficientStockException;
import com.Haat_Bazar.order_service.exception.ResourceNotFoundException;
import com.Haat_Bazar.order_service.model.*;
import com.Haat_Bazar.order_service.repository.OrderItemRepository;
import com.Haat_Bazar.order_service.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartService cartService;
    private final RestTemplate restTemplate;

    @Value("${inventory.service.url:http://localhost:8082}")
    private String inventoryServiceUrl;

    @Transactional
    public OrderResponse checkout(Long userId, CheckoutRequest checkoutRequest) {
        log.info("Starting checkout process for user: {}", userId);

        Cart cart = cartService.getCart(userId);

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new InsufficientStockException("Cannot checkout: Cart is empty");
        }

        checkInventoryStock(cart.getItems());

        Double total = cart.getCartTotal();

        Order order = Order.builder()
                .userId(userId)
                .totalAmount(total)
                .status(OrderStatus.PENDING)
                .items(new ArrayList<>())
                .build();

        List<OrderItem> orderItems = cart.getItems().stream()
                .map(cartItem -> OrderItem.builder()
                        .productId(cartItem.getProductId())
                        .sellerEmail(fetchSellerEmail(cartItem.getProductId()))
                        .quantity(cartItem.getQuantity())
                        .price(cartItem.getPrice())
                        .order(order)
                        .build())
                .collect(Collectors.toList());

        order.setItems(orderItems);
        Order savedOrder = orderRepository.save(order);

        deductInventoryStock(cart.getItems());
        cartService.clearCart(userId);

        savedOrder.setStatus(OrderStatus.CONFIRMED);
        Order finalizedOrder = orderRepository.save(savedOrder);

        return mapToOrderResponse(finalizedOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
        return mapToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByUser(Long userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
        order.setStatus(status);
        return mapToOrderResponse(orderRepository.save(order));
    }

    @Transactional
    public void markPaid(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public SellerSalesResponse getMySales(String sellerEmail) {
        List<OrderItem> items = orderItemRepository.findBySellerEmail(sellerEmail);

        double totalRevenue = items.stream()
                .mapToDouble(i -> i.getPrice() * i.getQuantity())
                .sum();

        Set<Long> orderIds = items.stream()
                .map(i -> i.getOrder().getId())
                .collect(Collectors.toSet());

        List<SellerSalesResponse.SaleRecord> sales = items.stream()
                .map(i -> SellerSalesResponse.SaleRecord.builder()
                        .orderId(i.getOrder().getId())
                        .orderDate(i.getOrder().getCreatedAt())
                        .productId(i.getProductId())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getPrice())
                        .lineTotal(i.getPrice() * i.getQuantity())
                        .orderStatus(i.getOrder().getStatus().name())
                        .build())
                .sorted(Comparator.comparing(SellerSalesResponse.SaleRecord::getOrderDate,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        return SellerSalesResponse.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(orderIds.size())
                .sales(sales)
                .build();
    }

    private String fetchSellerEmail(Long productId) {
        try {
            String url = inventoryServiceUrl + "/api/products/" + productId + "/seller-info";
            @SuppressWarnings("unchecked")
            Map<String, String> result = restTemplate.getForObject(url, Map.class);
            if (result != null) {
                String email = result.get("sellerEmail");
                return (email != null && !email.isEmpty()) ? email : null;
            }
        } catch (Exception e) {
            log.warn("Could not fetch sellerEmail for product {}: {}", productId, e.getMessage());
        }
        return null;
    }

    private void checkInventoryStock(List<CartItem> cartItems) {
        for (CartItem item : cartItems) {
            String url = inventoryServiceUrl + "/api/inventory/" + item.getProductId();
            try {
                Map<?, ?> inventory = restTemplate.getForObject(url, Map.class);
                if (inventory == null) {
                    throw new InsufficientStockException("Inventory not found for product: " + item.getProductId());
                }
                Object rawStock = inventory.get("stock") != null
                        ? inventory.get("stock")
                        : inventory.get("availableQuantity") != null
                            ? inventory.get("availableQuantity")
                            : inventory.get("quantity");
                Integer stock = rawStock != null ? ((Number) rawStock).intValue() : null;
                if (stock == null || stock < item.getQuantity()) {
                    throw new InsufficientStockException(
                            "Insufficient stock for product ID " + item.getProductId() +
                            ". Available: " + (stock == null ? 0 : stock) +
                            ", Requested: " + item.getQuantity());
                }
            } catch (InsufficientStockException e) {
                throw e;
            } catch (Exception e) {
                log.error("Error calling inventory-service for product {}: {}", item.getProductId(), e.getMessage());
                throw new InsufficientStockException(
                        "Could not verify stock for product ID " + item.getProductId() + ". Inventory service unavailable.");
            }
        }
    }

    private void deductInventoryStock(List<CartItem> cartItems) {
        for (CartItem item : cartItems) {
            String url = inventoryServiceUrl + "/api/inventory/" + item.getProductId()
                    + "/reduce?quantity=" + item.getQuantity();
            try {
                restTemplate.put(url, null);
            } catch (Exception e) {
                log.error("Failed to deduct stock for product {}: {}", item.getProductId(), e.getMessage());
            }
        }
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}
