package com.badmintion.gatewayservice.filter;

import java.util.List;
import java.util.function.Predicate;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

@Component
public class RouteValidator {

    private static final List<String> PUBLIC_PATHS = List.of(
            "/",
            "/sso/login",
            "/sso/register",
            "/auth/register",
            "/auth/login",
            "/auth/password-auth",
            "/auth/refresh",
            "/auth/logout",
            "/auth/google/register",
            "/auth/google/login"
    );

    public final Predicate<ServerHttpRequest> isSecured = request
            -> PUBLIC_PATHS.stream().noneMatch(path -> request.getURI().getPath().startsWith(path));
}
