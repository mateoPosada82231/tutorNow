package co.edu.epi.tutornow.auth;

import co.edu.epi.tutornow.auth.config.JwtAuthenticationFilter;
import co.edu.epi.tutornow.auth.service.JwtService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("deja la peticion sin autenticar cuando el usuario del token ya no existe")
    void shouldLeaveRequestUnauthenticatedWhenUserNoLongerExists() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token-valido");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.extractUsername("token-valido")).thenReturn("x@elpoli.edu.co");
        when(jwtService.extractType("token-valido")).thenReturn(JwtService.TYPE_ACCESS);
        when(userDetailsService.loadUserByUsername("x@elpoli.edu.co"))
                .thenThrow(new UsernameNotFoundException("Usuario no encontrado"));

        assertDoesNotThrow(() -> filter.doFilter(request, response, filterChain));

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("autentica la peticion cuando el token es valido y el usuario existe")
    void shouldAuthenticateRequestWhenTokenAndUserAreValid() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token-valido");
        MockHttpServletResponse response = new MockHttpServletResponse();

        var userDetails = User.builder()
                .username("ana@elpoli.edu.co")
                .password("hash")
                .roles("ESTUDIANTE")
                .build();

        when(jwtService.extractUsername("token-valido")).thenReturn("ana@elpoli.edu.co");
        when(jwtService.extractType("token-valido")).thenReturn(JwtService.TYPE_ACCESS);
        when(userDetailsService.loadUserByUsername("ana@elpoli.edu.co")).thenReturn(userDetails);
        when(jwtService.isTokenValid("token-valido", userDetails)).thenReturn(true);

        filter.doFilter(request, response, filterChain);

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(authentication);
        assertEquals("ana@elpoli.edu.co", authentication.getName());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("no autentica cuando la peticion no lleva cabecera Authorization")
    void shouldNotAuthenticateRequestWithoutAuthorizationHeader() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }
}
