package com.badmintion.authservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.annotation.JsonProperty;

@Service
public class GoogleTokenVerifierService {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifierService.class);

    private final RestTemplate restTemplate;

    @Value("${google.oauth.client-id}")
    private String googleClientId;

    public GoogleTokenVerifierService(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder.build();
    }

    public GoogleTokenPayload verifyAndExtract(String idToken) {
        log.info("Verifying Google ID token with tokenPrefix={}", tokenPrefix(idToken));

        if (!StringUtils.hasText(idToken)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google idToken is required");
        }

        GoogleTokenInfo tokenInfo;
        try {
            tokenInfo = restTemplate.getForObject(
                    "https://oauth2.googleapis.com/tokeninfo?id_token={idToken}",
                    GoogleTokenInfo.class,
                    idToken
            );
        } catch (RestClientException ex) {
            log.warn("Google token verification failed at Google endpoint, tokenPrefix={}", tokenPrefix(idToken));
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token is invalid", ex);
        }

        if (tokenInfo == null
                || !StringUtils.hasText(tokenInfo.email)
                || !StringUtils.hasText(tokenInfo.sub)
                || !"true".equalsIgnoreCase(tokenInfo.emailVerified)) {
            log.warn("Google token payload is invalid or email is not verified, tokenPrefix={}", tokenPrefix(idToken));
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token payload is invalid");
        }

        if (!StringUtils.hasText(googleClientId)) {
            log.error("Google OAuth client-id is missing in configuration");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Google OAuth is not configured");
        }

        if (!googleClientId.equals(tokenInfo.aud)) {
            log.warn("Google token audience mismatch: expected={}, actual={}", googleClientId, tokenInfo.aud);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token audience is invalid");
        }

        log.info("Google token verified successfully for email={}, subPrefix={}", tokenInfo.email, subjectPrefix(tokenInfo.sub));
        return new GoogleTokenPayload(tokenInfo.email, tokenInfo.name, tokenInfo.sub);
    }

    private String tokenPrefix(String token) {
        if (!StringUtils.hasText(token)) {
            return "empty";
        }
        int prefixLength = Math.min(12, token.length());
        return token.substring(0, prefixLength) + "...";
    }

    private String subjectPrefix(String subject) {
        if (!StringUtils.hasText(subject)) {
            return "empty";
        }
        int prefixLength = Math.min(8, subject.length());
        return subject.substring(0, prefixLength) + "...";
    }

    private static class GoogleTokenInfo {

        private String email;

        @JsonProperty("email_verified")
        private String emailVerified;

        private String name;
        private String sub;
        private String aud;
    }
}
