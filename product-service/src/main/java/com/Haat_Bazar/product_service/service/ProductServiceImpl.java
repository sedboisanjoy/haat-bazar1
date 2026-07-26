package com.Haat_Bazar.product_service.service;

import com.Haat_Bazar.product_service.dto.ProductRequest;
import com.Haat_Bazar.product_service.dto.ProductResponse;
import com.Haat_Bazar.product_service.entity.Category;
import com.Haat_Bazar.product_service.entity.Inventory;
import com.Haat_Bazar.product_service.entity.Product;
import com.Haat_Bazar.product_service.exception.ResourceNotFoundException;
import com.Haat_Bazar.product_service.repository.CategoryRepository;
import com.Haat_Bazar.product_service.repository.InventoryRepository;
import com.Haat_Bazar.product_service.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request, String sellerEmail) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock())
                .category(category)
                .sellerEmail(sellerEmail)
                .build();

        productRepository.save(product);

        Inventory inventory = Inventory.builder()
                .product(product)
                .quantity(request.getStock())
                .build();
        inventoryRepository.save(inventory);

        return mapToResponse(product);
    }

    @Override
    public ProductResponse getProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return mapToResponse(product);
    }

    @Override
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Override
    public List<ProductResponse> getMyProducts(String sellerEmail) {
        return productRepository.findBySellerEmail(sellerEmail).stream().map(this::mapToResponse).toList();
    }

    @Override
    public String getProductSellerEmail(Long productId) {
        return productRepository.findById(productId)
                .map(Product::getSellerEmail)
                .orElse(null);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request, String sellerEmail) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (product.getSellerEmail() != null && !product.getSellerEmail().equals(sellerEmail)) {
            throw new RuntimeException("You can only edit your own products");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setCategory(category);

        productRepository.save(product);

        inventoryRepository.findByProductId(id).ifPresent(inv -> {
            inv.setQuantity(request.getStock());
            inventoryRepository.save(inv);
        });

        return mapToResponse(product);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id, String sellerEmail) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (product.getSellerEmail() != null && !product.getSellerEmail().equals(sellerEmail)) {
            throw new RuntimeException("You can only delete your own products");
        }

        inventoryRepository.findByProductId(id).ifPresent(inventoryRepository::delete);
        productRepository.delete(product);
    }

    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stock(product.getStock())
                .category(product.getCategory() != null ? product.getCategory().getName() : null)
                .sellerEmail(product.getSellerEmail())
                .build();
    }
}
