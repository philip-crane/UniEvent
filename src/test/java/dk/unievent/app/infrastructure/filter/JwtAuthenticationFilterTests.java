package dk.unievent.app.infrastructure.filter;

import dk.unievent.app.application.service.JwtService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTests {

    @Mock
    private JwtService jwtService;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldSkipFilterAndContinueChainWhenNoAuthorizationHeader() throws Exception {
        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldSkipFilterWhenAuthorizationHeaderIsNotBearer() throws Exception {
        request.addHeader(HttpHeaders.AUTHORIZATION, "Basic dXNlcjpwYXNz");

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(jwtService);
    }

    @Test
    void shouldPopulateSecurityContextWhenTokenIsValid() throws Exception {
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer valid-token");
        when(jwtService.extractUsername("valid-token")).thenReturn("test@example.com");
        when(jwtService.isTokenValid("valid-token", "test@example.com")).thenReturn(true);
        when(jwtService.extractAuthorities("valid-token"))
            .thenReturn(List.of(new SimpleGrantedAuthority("ROLE_USER")));

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("test@example.com",
            SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @Test
    void shouldNotSetAuthenticationWhenTokenIsInvalid() throws Exception {
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer bad-token");
        when(jwtService.extractUsername("bad-token")).thenReturn("test@example.com");
        when(jwtService.isTokenValid("bad-token", "test@example.com")).thenReturn(false);

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldContinueChainWhenUsernameNotExtracted() throws Exception {
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer orphan-token");
        when(jwtService.extractUsername("orphan-token")).thenReturn(null);

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldSkipAuthWhenContextAlreadyHasAuthentication() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("existing", null, List.of())
        );

        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer some-token");
        when(jwtService.extractUsername("some-token")).thenReturn("test@example.com");

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoMoreInteractions(jwtService);
    }
}
