package com.Haat_Bazar.product_service.controller;

import com.Haat_Bazar.product_service.dto.ProductRequest;
import com.Haat_Bazar.product_service.dto.ProductResponse;
import com.Haat_Bazar.product_service.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ProductResponse createProduct(@RequestBody ProductRequest request, Principal principal) {
        return productService.createProduct(request, principal.getName());
    }

    @GetMapping("/{id}")
    public ProductResponse getProduct(@PathVariable Long id) {
        return productService.getProduct(id);
    }

    @GetMapping
    public List<ProductResponse> getAllProducts() {
        return productService.getAllProducts();
    }

    // Returns only products that belong to the authenticated seller
    @GetMapping("/mine")
    public List<ProductResponse> getMyProducts(Principal principal) {
        return productService.getMyProducts(principal.getName());
    }

    // Internal endpoint called by order-service (no user JWT) to get the seller of a product
    @GetMapping("/{id}/seller-info")
    public ResponseEntity<Map<String, String>> getSellerInfo(@PathVariable Long id) {
        String email = productService.getProductSellerEmail(id);
        return ResponseEntity.ok(Map.of("sellerEmail", email != null ? email : ""));
    }

    @PutMapping("/{id}")
    public ProductResponse updateProduct(@PathVariable Long id,
                                         @RequestBody ProductRequest request,
                                         Principal principal) {
        return productService.updateProduct(id, request, principal.getName());
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id, Principal principal) {
        productService.deleteProduct(id, principal.getName());
    }
}
