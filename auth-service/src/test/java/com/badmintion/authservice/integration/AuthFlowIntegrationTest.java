package com.badmintion.authservice.integration;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.badmintion.authservice.security.JwtService;
import com.badmintion.authservice.service.GoogleTokenPayload;
import com.badmintion.authservice.service.GoogleTokenVerifierService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private GoogleTokenVerifierService googleTokenVerifierService;

    @Test
    void registerShouldCreateUser() throws Exception {
        String payload = """
                {
                  "username": "tester_register",
                  "email": "tester_register@example.com",
                  "password": "secret123"
                }
                """;

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk());
    }

    @Test
    void loginRememberMeRefreshAndLogoutFlowShouldWork() throws Exception {
        when(jwtService.generateAccessToken(any(UserDetails.class))).thenReturn("access-token-1", "access-token-2");
        when(jwtService.generateRefreshToken(any(UserDetails.class))).thenReturn("refresh-token-1");
        when(jwtService.extractExpiration(anyString())).thenReturn(new java.util.Date(System.currentTimeMillis() + 3600000));
        when(jwtService.isRefreshToken("refresh-token-1")).thenReturn(true);
        when(jwtService.isTokenValid(anyString(), any(UserDetails.class))).thenReturn(true);

        String username = "tester_login";

        String registerPayload = """
                {
                  "username": "%s",
                  "email": "tester_login@example.com",
                  "password": "secret123"
                }
                """.formatted(username);

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerPayload))
                .andExpect(status().isOk());

        String loginPayload = """
                {
                  "username": "%s",
                  "password": "secret123",
                  "rememberMe": true
                }
                """.formatted(username);

        String loginResponse = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.userRole").value("USER"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode loginJson = objectMapper.readTree(loginResponse);
        String refreshToken = loginJson.get("refreshToken").asText();
        assertThat(refreshToken).isNotBlank();

        String refreshPayload = """
                {
                  "refreshToken": "%s"
                }
                """.formatted(refreshToken);

        mockMvc.perform(post("/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").value(refreshToken))
                .andExpect(jsonPath("$.userRole").value("USER"));

        mockMvc.perform(post("/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshPayload))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshPayload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginWithoutRememberMeShouldReturnOnlyAccessToken() throws Exception {
        when(jwtService.generateAccessToken(any(UserDetails.class))).thenReturn("access-token-no-remember");

        String username = "tester_no_remember";

        String registerPayload = """
                {
                  "username": "%s",
                  "email": "tester_no_remember@example.com",
                  "password": "secret123"
                }
                """.formatted(username);

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerPayload))
                .andExpect(status().isOk());

        String loginPayload = """
                {
                  "username": "%s",
                  "password": "secret123",
                  "rememberMe": false
                }
                """.formatted(username);

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isEmpty())
                .andExpect(jsonPath("$.userRole").value("USER"));
    }

    @Test
    void googleRegisterShouldCreateUserAndReturnTokens() throws Exception {
        when(googleTokenVerifierService.verifyAndExtract(anyString()))
                .thenReturn(new GoogleTokenPayload("google_register@example.com", "Google Register", "google-sub-1"));
        when(jwtService.generateAccessToken(any(UserDetails.class))).thenReturn("google-register-access-token");
        when(jwtService.generateRefreshToken(any(UserDetails.class))).thenReturn("google-register-refresh-token");
        when(jwtService.extractExpiration(anyString())).thenReturn(new java.util.Date(System.currentTimeMillis() + 3600000));

        String googleRegisterPayload = """
                {
                  "idToken": "google-id-token-register",
                  "rememberMe": true
                }
                """;

        mockMvc.perform(post("/auth/google/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(googleRegisterPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("google-register-access-token"))
                .andExpect(jsonPath("$.refreshToken").value("google-register-refresh-token"))
                .andExpect(jsonPath("$.userRole").value("USER"));
    }

    @Test
    void googleLoginShouldAuthenticateExistingUserAndReturnAccessToken() throws Exception {
        when(googleTokenVerifierService.verifyAndExtract(anyString()))
                .thenReturn(new GoogleTokenPayload("google_login@example.com", "Google Login", "google-sub-2"));
        when(jwtService.generateAccessToken(any(UserDetails.class))).thenReturn("google-login-access-token");

        String registerPayload = """
                {
                  "username": "google_login_user",
                  "email": "google_login@example.com",
                  "password": "secret123"
                }
                """;

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerPayload))
                .andExpect(status().isOk());

        String googleLoginPayload = """
                {
                  "idToken": "google-id-token-login",
                  "rememberMe": false
                }
                """;

        mockMvc.perform(post("/auth/google/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(googleLoginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("google-login-access-token"))
                .andExpect(jsonPath("$.refreshToken").isEmpty())
                .andExpect(jsonPath("$.userRole").value("USER"));
    }
}
