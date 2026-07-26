package com.Haat_Bazar.order_service.controller;

import com.Haat_Bazar.order_service.dto.CheckoutRequest;
import com.Haat_Bazar.order_service.dto.OrderResponse;
import com.Haat_Bazar.order_service.dto.SellerSalesResponse;
import com.Haat_Bazar.order_service.model.OrderStatus;
import com.Haat_Bazar.order_service.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout/{userId}")
    public ResponseEntity<OrderResponse> checkout(@PathVariable Long userId,
                                                  @Valid @RequestBody CheckoutRequest request) {
        return new ResponseEntity<>(orderService.checkout(userId, request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrder(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getOrdersByUser(userId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable Long id,
                                                           @RequestParam OrderStatus status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    /**
     * REQ-PAY-03: Called by payment-service via Feign to finalize an order after payment.
     */
    @PutMapping("/{orderId}/mark-paid")
    public ResponseEntity<Void> markPaid(@PathVariable Long orderId) {
        orderService.markPaid(orderId);
        return ResponseEntity.ok().build();
    }

    // Returns sales data for the currently authenticated seller
    @GetMapping("/my-sales")
    public ResponseEntity<SellerSalesResponse> getMySales(Principal principal) {
        return ResponseEntity.ok(orderService.getMySales(principal.getName()));
    }
}
