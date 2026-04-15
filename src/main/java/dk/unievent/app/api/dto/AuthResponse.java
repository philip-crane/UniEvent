package dk.unievent.app.api.dto;

public record AuthResponse(String token, String username, String email) {}