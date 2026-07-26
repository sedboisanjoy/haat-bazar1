package com.Haat_Bazar.backup_service.config;

import com.Haat_Bazar.backup_service.security.JwtAuthFilter;
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
                        // only ADMIN can trigger, delete, or download backups
                        .requestMatchers(HttpMethod.POST, "/api/backup/trigger").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/backup/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/backup/*/download").hasRole("ADMIN")
                        // listing backups visible to ADMIN and SELLER
                        .requestMatchers(HttpMethod.GET, "/api/backup/**").hasAnyRole("ADMIN", "SELLER")
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
