package dk.unievent.app.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import dk.unievent.app.infrastructure.filter.JwtAuthenticationFilter;

/**
 * Security Configuration
 *
 * Actuator strategy:
 *   /actuator/health - public (Docker probes and load balancer checks cannot authenticate)
 *   /actuator/info  - public (static build metadata, no secrets)
 *   /actuator/**    - denyAll (metrics and other endpoints blocked in production)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/**").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/**").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/**").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/media/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/media/**").authenticated()
                .requestMatchers("/admin/tools/**").authenticated()
                .requestMatchers("/admin/**").authenticated()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/actuator/**").denyAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            .httpBasic(basic -> basic.disable())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

}
