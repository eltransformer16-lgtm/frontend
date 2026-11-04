package com.microgurity.demo;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Cliente HTTP del backend .NET. La URL base se configura en
 * application.properties (backend.url) o con la variable de entorno BACKEND_URL.
 */
@Service
public class BackendClient {

    private static final ParameterizedTypeReference<Map<String, Object>> JSON_MAP =
            new ParameterizedTypeReference<>() {};

    private final RestClient http;

    public BackendClient(@Value("${backend.url}") String baseUrl) {
        this.http = RestClient.builder().baseUrl(baseUrl).build();
    }

    public Map<String, Object> register(String username, String email, String password) {
        return http.post()
                .uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("username", username, "email", email, "password", password))
                .retrieve()
                .body(JSON_MAP);
    }

    public Map<String, Object> login(String email, String password) {
        return http.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("email", email, "password", password))
                .retrieve()
                .body(JSON_MAP);
    }

    public Map<String, Object> me(String accessToken) {
        return http.get()
                .uri("/api/auth/me")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(JSON_MAP);
    }
}
