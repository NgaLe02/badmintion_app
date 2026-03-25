package com.badmintion.authservice.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.badmintion.authservice.model.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;

@Service
public class JwtService {

    @Value("${jwt.private-key-path}")
    private String privateKeyPath;

    @Value("${jwt.public-key-path}")
    private String publicKeyPath;

    @Value("${jwt.access-token-expiration-ms}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpiration;

    private PrivateKey privateKey;
    private PublicKey publicKey;

    @PostConstruct
    public void initKeys() {
        this.privateKey = loadPrivateKey(privateKeyPath);
        this.publicKey = loadPublicKey(publicKeyPath);
    }

    public String generateAccessToken(UserDetails userDetails) {
        if (userDetails instanceof User user) {
            return generateToken(Map.of(
                    "type", "access",
                    "userId", user.getId(),
                    "role", user.getRole().name()
            ), userDetails, accessTokenExpiration);
        }
        return generateToken(Map.of("type", "access"), userDetails, accessTokenExpiration);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        if (userDetails instanceof User user) {
            return generateToken(Map.of(
                    "type", "refresh",
                    "userId", user.getId(),
                    "role", user.getRole().name()
            ), userDetails, refreshTokenExpiration);
        }
        return generateToken(Map.of("type", "refresh"), userDetails, refreshTokenExpiration);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(extractAllClaims(token).get("type", String.class));
    }

    public boolean isAccessToken(String token) {
        return "access".equals(extractAllClaims(token).get("type", String.class));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private String generateToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiration) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(now))
                .expiration(new Date(now + expiration))
                .signWith(privateKey)
                .compact();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private PrivateKey loadPrivateKey(String path) {
        try {
            byte[] keyBytes = decodeKeyMaterial(readResource(path), "PRIVATE KEY");
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);
            return KeyFactory.getInstance("RSA").generatePrivate(keySpec);
        } catch (GeneralSecurityException | IOException ex) {
            throw new IllegalStateException("Unable to load private key from " + path, ex);
        }
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
