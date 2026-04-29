package dk.unievent.app.api.dto;

import java.util.List;

public record AuthResponse(
	String username,
	String email,
	List<String> roles,
	String csrfToken,
	long accessTokenExpiresInMs
) {}
