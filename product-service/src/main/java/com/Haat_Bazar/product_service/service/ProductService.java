package com.Haat_Bazar.product_service.service;

import com.Haat_Bazar.product_service.dto.ProductRequest;
import com.Haat_Bazar.product_service.dto.ProductResponse;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductRequest request, String sellerEmail);

    ProductResponse getProduct(Long id);

    List<ProductResponse> getAllProducts();

    List<ProductResponse> getMyProducts(String sellerEmail);

    String getProductSellerEmail(Long productId);

    ProductResponse updateProduct(Long id, ProductRequest request, String sellerEmail);

    void deleteProduct(Long id, String sellerEmail);
}
