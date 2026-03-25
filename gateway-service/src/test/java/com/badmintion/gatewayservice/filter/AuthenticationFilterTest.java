package com.badmintion.gatewayservice.filter;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;

import com.badmintion.gatewayservice.security.JwtUtil;

import reactor.core.publisher.Mono;

class AuthenticationFilterTest {

    @Test
    void shouldBypassPublicPath() {
        RouteValidator routeValidator = new RouteValidator();
        JwtUtil jwtUtil = mock(JwtUtil.class);
        AuthenticationFilter filter = new AuthenticationFilter(routeValidator, jwtUtil);

        GatewayFilterChain chain = exchange -> Mono.empty();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/auth/login").build()
        );

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    @Test
    void shouldReturnUnauthorizedWhenAuthorizationHeaderMissing() {
        RouteValidator routeValidator = new RouteValidator();
        JwtUtil jwtUtil = mock(JwtUtil.class);
        AuthenticationFilter filter = new AuthenticationFilter(routeValidator, jwtUtil);

        GatewayFilterChain chain = exchange -> Mono.empty();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/facilities").build()
        );

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void shouldMutateHeadersWhenTokenIsValid() {
        RouteValidator routeValidator = new RouteValidator();
        JwtUtil jwtUtil = mock(JwtUtil.class);
        AuthenticationFilter filter = new AuthenticationFilter(routeValidator, jwtUtil);

        String token = "valid-token";
        when(jwtUtil.validateToken(token)).thenReturn(true);
        when(jwtUtil.isAccessToken(token)).thenReturn(true);
        when(jwtUtil.extractUserId(token)).thenReturn("123");
        when(jwtUtil.extractRole(token)).thenReturn("USER");

        @SuppressWarnings("unchecked")
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());

        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/facilities")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .build()
        );

        filter.filter(exchange, chain).block();

        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        verify(chain).filter(captor.capture());

        ServerHttpRequest forwardedRequest = captor.getValue().getRequest();
        assertThat(forwardedRequest.getHeaders().getFirst("X-User-Id")).isEqualTo("123");
        assertThat(forwardedRequest.getHeaders().getFirst("X-User-Role")).isEqualTo("USER");
    }

    @Test
    void shouldReturnUnauthorizedWhenClaimsMissing() {
        RouteValidator routeValidator = new RouteValidator();
        JwtUtil jwtUtil = mock(JwtUtil.class);
        AuthenticationFilter filter = new AuthenticationFilter(routeValidator, jwtUtil);

        String token = "valid-token";
        when(jwtUtil.validateToken(token)).thenReturn(true);
        when(jwtUtil.isAccessToken(token)).thenReturn(true);
        when(jwtUtil.extractUserId(token)).thenReturn("");
        when(jwtUtil.extractRole(token)).thenReturn("USER");

        GatewayFilterChain chain = exchange -> Mono.empty();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/facilities")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .build()
        );

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
