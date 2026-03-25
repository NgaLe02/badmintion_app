package com.badmintion.gatewayservice.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;

@Component
public class JwtUtil {

    @Value("${jwt.public-key-path:classpath:rsa/publicKey.rsa}")
    private String publicKeyPath;

    private PublicKey publicKey;

    @PostConstruct
    public void init() {
        this.publicKey = loadPublicKey(publicKeyPath);
    }

    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public boolean isAccessToken(String token) {
        return "access".equals(extractAllClaims(token).get("type", String.class));
    }

    public String extractUserId(String token) {
        Object userId = extractAllClaims(token).get("userId");
        return userId == null ? null : userId.toString();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private PublicKey loadPublicKey(String path) {
        try {
            byte[] keyBytes = decodeKeyMaterial(readResource(path), "PUBLIC KEY");
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
            return KeyFactory.getInstance("RSA").generatePublic(keySpec);
        } catch (GeneralSecurityException | IOException ex) {
            throw new IllegalStateException("Unable to load public key from " + path, ex);
        }
    }

    private byte[] readResource(String path) throws IOException {
        String normalizedPath = path.startsWith("classpath:") ? path.substring("classpath:".length()) : path;
        ClassPathResource resource = new ClassPathResource(normalizedPath);
        return resource.getInputStream().readAllBytes();
    }

    private byte[] decodeKeyMaterial(byte[] rawBytes, String keyType) {
        String content = new String(rawBytes, StandardCharsets.UTF_8);
        String beginMarker = "-----BEGIN " + keyType + "-----";
        if (!content.contains(beginMarker)) {
            return rawBytes;
        }

        String endMarker = "-----END " + keyType + "-----";
        String base64Content = content
                .replace(beginMarker, "")
                .replace(endMarker, "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(base64Content);
    }
}
