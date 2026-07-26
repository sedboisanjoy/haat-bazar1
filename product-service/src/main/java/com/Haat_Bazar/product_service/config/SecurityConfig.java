package com.Haat_Bazar.product_service.config;

import com.Haat_Bazar.product_service.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth

                        // Internal endpoint called by order-service (no user token)
                        .requestMatchers(HttpMethod.GET, "/api/products/*/seller-info").permitAll()

                        // Everyone logged in can VIEW products and their own list
                        .requestMatchers(HttpMethod.GET, "/api/products/**").authenticated()

                        // Only SELLER can create/update/delete products (not ADMIN)
                        .requestMatchers(HttpMethod.POST, "/api/products/**").hasRole("SELLER")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("SELLER")
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("SELLER")

                        // Everyone logged in can VIEW categories
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").authenticated()

                        // Only SELLER can manage categories (not ADMIN)
                        .requestMatchers(HttpMethod.POST, "/api/categories/**").hasRole("SELLER")
                        .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("SELLER")
                        .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole("SELLER")

                        // Inventory endpoints — called internally by order-service
                        .requestMatchers(HttpMethod.GET, "/api/inventory/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/inventory/*/reduce").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/inventory/check-stock").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/inventory/reduce").permitAll()

                        // Only SELLER can manually set stock levels
                        .requestMatchers(HttpMethod.PUT, "/api/inventory/**").hasRole("SELLER")

                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
