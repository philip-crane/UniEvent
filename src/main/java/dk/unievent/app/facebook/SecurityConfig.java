package dk.unievent.app.facebook;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Security Configuration
 * 
 * By default, Spring Security requires authentication for everything.
 * This config allows PUBLIC access to /api endpoints (no login needed)
 * 
 * In production, you'd add proper authentication here, but for development
 * we'll allow open access to test the API.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${unievent.security.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}")
    private List<String> allowedOrigins;
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Allow public access to /api endpoints (no authentication required)
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/**").permitAll()  // All /api/* endpoints are public
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll() // Swagger UI and OpenAPI docs
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/actuator/**").denyAll()
                .anyRequest().permitAll()            // Development: allow all other requests
            )
            // Explicitly enable CORS for configured frontend origins.
            .cors(cors -> {})
            // Disable CSRF for development (not recommended for production)
            .csrf(csrf -> csrf.disable())
            // Disable default login form
            .httpBasic(basic -> basic.disable());
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
