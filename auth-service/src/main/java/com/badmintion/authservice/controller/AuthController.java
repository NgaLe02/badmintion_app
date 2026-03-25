package com.badmintion.authservice.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.badmintion.authservice.dto.AuthRequest;
import com.badmintion.authservice.dto.AuthResponse;
import com.badmintion.authservice.dto.GoogleAuthRequest;
import com.badmintion.authservice.dto.RefreshTokenRequest;
import com.badmintion.authservice.dto.RegisterRequest;
import com.badmintion.authservice.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Received register request for username={}, email={}", request.getUsername(), request.getEmail());
        authService.register(request);
        log.info("Register completed for username={}", request.getUsername());
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        log.info("Received login request for username={}, rememberMe={}", request.getUsername(), request.getRememberMe());
        AuthResponse response = authService.login(request);
        log.info("Login completed for username={}, role={}", request.getUsername(), response.getUserRole());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Received refresh request with tokenPrefix={}", tokenPrefix(request.getRefreshToken()));
        AuthResponse response = authService.refresh(request.getRefreshToken());
        log.info("Refresh completed for role={}", response.getUserRole());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Received logout request with tokenPrefix={}", tokenPrefix(request.getRefreshToken()));
        authService.logout(request.getRefreshToken());
        log.info("Logout completed for tokenPrefix={}", tokenPrefix(request.getRefreshToken()));
        return ResponseEntity.ok("Logged out successfully");
    }

    @PostMapping("/google/register")
    public ResponseEntity<AuthResponse> registerWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        log.info("Received Google register request with rememberMe={}, tokenPrefix={}",
                request.getRememberMe(), tokenPrefix(request.getIdToken()));
        AuthResponse response = authService.registerWithGoogle(request);
        log.info("Google register completed with role={}", response.getUserRole());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google/login")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        log.info("Received Google login request with rememberMe={}, tokenPrefix={}",
                request.getRememberMe(), tokenPrefix(request.getIdToken()));
        AuthResponse response = authService.loginWithGoogle(request);
        log.info("Google login completed with role={}", response.getUserRole());
        return ResponseEntity.ok(response);
    }

    private String tokenPrefix(String token) {
        if (token == null || token.isBlank()) {
            return "empty";
        }
        int prefixLength = Math.min(12, token.length());
        return token.substring(0, prefixLength) + "...";
    }
}
