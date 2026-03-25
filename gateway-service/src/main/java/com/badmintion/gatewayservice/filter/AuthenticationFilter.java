package com.badmintion.gatewayservice.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;

import com.badmintion.gatewayservice.security.JwtUtil;

import reactor.core.publisher.Mono;

@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationFilter.class);

    private final RouteValidator routeValidator;
    private final JwtUtil jwtUtil;

    public AuthenticationFilter(RouteValidator routeValidator, JwtUtil jwtUtil) {
        this.routeValidator = routeValidator;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        if (!routeValidator.isSecured.test(request)) {
            log.info("Gateway skipped auth for public path={}", path);
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            log.warn("Gateway unauthorized: missing/invalid Authorization header for path={}", path);
            return unauthorized(exchange);
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token) || !jwtUtil.isAccessToken(token)) {
            log.warn("Gateway unauthorized: invalid token for path={}, tokenPrefix={}", path, tokenPrefix(token));
            return unauthorized(exchange);
        }

        String userId = jwtUtil.extractUserId(token);
        String role = jwtUtil.extractRole(token);
        if (!StringUtils.hasText(userId) || !StringUtils.hasText(role)) {
            log.warn("Gateway unauthorized: missing claims for path={}, tokenPrefix={}", path, tokenPrefix(token));
            return unauthorized(exchange);
        }

        log.info("Gateway authorized path={}, userId={}, role={}", path, userId, role);

        ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Id", userId)
                .header("X-User-Role", role)
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    private String tokenPrefix(String token) {
        if (!StringUtils.hasText(token)) {
            return "empty";
        }
        int prefixLength = Math.min(12, token.length());
        return token.substring(0, prefixLength) + "...";
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
