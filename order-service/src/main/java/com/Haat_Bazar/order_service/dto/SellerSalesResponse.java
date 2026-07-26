package com.Haat_Bazar.order_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SellerSalesResponse {

    private Double totalRevenue;
    private Integer totalOrders;
    private List<SaleRecord> sales;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SaleRecord {
        private Long orderId;
        private LocalDateTime orderDate;
        private Long productId;
        private Integer quantity;
        private Double unitPrice;
        private Double lineTotal;
        private String orderStatus;
    }
}
