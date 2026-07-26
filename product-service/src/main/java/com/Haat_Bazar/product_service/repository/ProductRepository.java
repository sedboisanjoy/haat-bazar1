package com.Haat_Bazar.product_service.repository;

import com.Haat_Bazar.product_service.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findBySellerEmail(String sellerEmail);
}
