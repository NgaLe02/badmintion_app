package com.badmintion.authservice.service;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.badmintion.authservice.dto.AuthRequest;
import com.badmintion.authservice.dto.AuthResponse;
import com.badmintion.authservice.dto.GoogleAuthRequest;
import com.badmintion.authservice.dto.RegisterRequest;
import com.badmintion.authservice.model.RefreshToken;
import com.badmintion.authservice.model.Role;
import com.badmintion.authservice.model.User;
import com.badmintion.authservice.repository.RefreshTokenRepository;
import com.badmintion.authservice.repository.UserRepository;
import com.badmintion.authservice.security.JwtService;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final GoogleTokenVerifierService googleTokenVerifierService;

    public AuthService(UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            GoogleTokenVerifierService googleTokenVerifierService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.googleTokenVerifierService = googleTokenVerifierService;
    }

    public void register(RegisterRequest request) {
        log.info("Register attempt for username={}, email={}", request.getUsername(), request.getEmail());
        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("Register rejected because username already exists: {}", request.getUsername());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Register rejected because email already exists: {}", request.getEmail());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);

        userRepository.save(user);
        log.info("Register success for username={}, role={}", user.getUsername(), user.getRole());
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        log.info("Login attempt for username={}, rememberMe={}", request.getUsername(), request.getRememberMe());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User authenticatedUser = (User) authentication.getPrincipal();
        return issueAuthResponse(authenticatedUser, request.getRememberMe(), "password-login");
    }

    @Transactional
    public AuthResponse registerWithGoogle(GoogleAuthRequest request) {
        log.info("Google register attempt with rememberMe={}", request.getRememberMe());
        GoogleTokenPayload googlePayload = googleTokenVerifierService.verifyAndExtract(request.getIdToken());

        if (userRepository.existsByEmail(googlePayload.email())) {
            log.warn("Google register rejected because email already exists: {}", googlePayload.email());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }

        String uniqueUsername = generateUniqueUsername(googlePayload);

        User user = new User();
        user.setUsername(uniqueUsername);
        user.setEmail(googlePayload.email());
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setRole(Role.USER);

        User savedUser = userRepository.save(user);
        log.info("Google register success for email={}, username={}, role={}, subPrefix={}",
                savedUser.getEmail(), savedUser.getUsername(), savedUser.getRole(), subjectPrefix(googlePayload.subject()));

        return issueAuthResponse(savedUser, request.getRememberMe(), "google-register");
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        log.info("Google login attempt with rememberMe={}", request.getRememberMe());
        GoogleTokenPayload googlePayload = googleTokenVerifierService.verifyAndExtract(request.getIdToken());

        User user = userRepository.findByEmail(googlePayload.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google account is not registered"));

        log.info("Google login success for email={}, username={}, role={}, subPrefix={}",
                user.getEmail(), user.getUsername(), user.getRole(), subjectPrefix(googlePayload.subject()));

        return issueAuthResponse(user, request.getRememberMe(), "google-login");
    }

    private AuthResponse issueAuthResponse(User authenticatedUser, Boolean rememberMe, String flowName) {
        String accessToken = jwtService.generateAccessToken(authenticatedUser);
        String refreshToken = null;
        if (Boolean.TRUE.equals(rememberMe)) {
            refreshTokenRepository.deleteByUser(authenticatedUser);
            refreshToken = jwtService.generateRefreshToken(authenticatedUser);
            saveRefreshToken(authenticatedUser, refreshToken);
            log.info("{} success with remember-me for username={}, refreshTokenPrefix={}",
                    flowName, authenticatedUser.getUsername(), tokenPrefix(refreshToken));
        } else {
            log.info("{} success without remember-me for username={}", flowName, authenticatedUser.getUsername());
        }

        return new AuthResponse(accessToken, refreshToken, authenticatedUser.getRole().name());
    }

    private String generateUniqueUsername(GoogleTokenPayload googlePayload) {
        String base = googlePayload.name();
        if (base == null || base.isBlank()) {
            int atIndex = googlePayload.email().indexOf('@');
            base = atIndex > 0 ? googlePayload.email().substring(0, atIndex) : "googleuser";
        }

        String normalizedBase = base
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "")
                .trim();
        if (normalizedBase.isBlank()) {
            normalizedBase = "googleuser";
        }

        String candidate = normalizedBase;
        int sequence = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = normalizedBase + sequence;
            sequence++;
        }

        return candidate;
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(String rawRefreshToken) {
        log.info("Refresh attempt with tokenPrefix={}", tokenPrefix(rawRefreshToken));
        RefreshToken storedRefreshToken = refreshTokenRepository.findByToken(rawRefreshToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid"));

        if (storedRefreshToken.isRevoked() || storedRefreshToken.getExpiryDate().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has expired or revoked");
        }

        if (!jwtService.isRefreshToken(rawRefreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token is not a refresh token");
        }

        User user = storedRefreshToken.getUser();
        if (!jwtService.isTokenValid(rawRefreshToken, user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid");
        }

        String newAccessToken = jwtService.generateAccessToken(user);
        log.info("Refresh success for username={}, role={}", user.getUsername(), user.getRole());
        return new AuthResponse(newAccessToken, rawRefreshToken, user.getRole().name());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        log.info("Logout attempt with tokenPrefix={}", tokenPrefix(rawRefreshToken));
        RefreshToken storedRefreshToken = refreshTokenRepository.findByToken(rawRefreshToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid"));

        if (storedRefreshToken.isRevoked()) {
            log.info("Logout ignored because token already revoked, tokenPrefix={}", tokenPrefix(rawRefreshToken));
            return;
        }

        storedRefreshToken.setRevoked(true);
        refreshTokenRepository.save(storedRefreshToken);
        log.info("Logout success for username={}, token revoked", storedRefreshToken.getUser().getUsername());
    }

    private void saveRefreshToken(User user, String token) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(token);
        refreshToken.setUser(user);
        refreshToken.setRevoked(false);
        refreshToken.setExpiryDate(jwtService.extractExpiration(token).toInstant());
        refreshTokenRepository.save(refreshToken);
        log.info("Refresh token persisted for username={}, expiresAt={}", user.getUsername(), refreshToken.getExpiryDate());
    }

    private String tokenPrefix(String token) {
        if (token == null || token.isBlank()) {
            return "empty";
        }
        int prefixLength = Math.min(12, token.length());
        return token.substring(0, prefixLength) + "...";
    }

    private String subjectPrefix(String subject) {
        if (subject == null || subject.isBlank()) {
            return "empty";
        }
        int prefixLength = Math.min(8, subject.length());
        return subject.substring(0, prefixLength) + "...";
    }
}
