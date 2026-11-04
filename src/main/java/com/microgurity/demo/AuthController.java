package com.microgurity.demo;

import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;

import jakarta.servlet.http.HttpSession;

/**
 * Pantallas de prueba que comunican el frontend con el backend.
 * Los tokens se guardan en la sesión del servidor, no en el navegador.
 */
@Controller
public class AuthController {

    private final BackendClient backend;

    public AuthController(BackendClient backend) {
        this.backend = backend;
    }

    @PostMapping("/register")
    public String register(@RequestParam String username,
                           @RequestParam String email,
                           @RequestParam String password) {
        try {
            backend.register(username, email, password);
            return "redirect:/?ok=registrado";
        } catch (HttpClientErrorException e) {
            return "redirect:/?error=registro" + e.getStatusCode().value();
        } catch (ResourceAccessException e) {
            return "redirect:/?error=sinconexion";
        }
    }

    @PostMapping("/login")
    public String login(@RequestParam String email,
                        @RequestParam String password,
                        HttpSession session) {
        try {
            Map<String, Object> result = backend.login(email, password);
            session.setAttribute("token", result.get("token"));
            session.setAttribute("refreshToken", result.get("refreshToken"));
            return "redirect:/me";
        } catch (HttpClientErrorException e) {
            return "redirect:/?error=login" + e.getStatusCode().value();
        } catch (ResourceAccessException e) {
            return "redirect:/?error=sinconexion";
        }
    }

    @GetMapping("/me")
    @ResponseBody
    public Object me(HttpSession session) {
        Object token = session.getAttribute("token");
        if (token == null) {
            return Map.of("error", "No has iniciado sesión");
        }
        try {
            return backend.me(token.toString());
        } catch (HttpClientErrorException e) {
            return Map.of("error", "Sesión inválida o expirada", "status", e.getStatusCode().value());
        } catch (ResourceAccessException e) {
            return Map.of("error", "No se pudo conectar con el backend");
        }
    }

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/";
    }
}
