package com.Haat_Bazar.payment_service.dto;

import com.Haat_Bazar.payment_service.entity.PaymentMethod;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentRequest {
    private Long orderId;
    private Long userId;
    private Double amount;
    @NotNull(message = "Payment method is required")
    private PaymentMethod method;
}
