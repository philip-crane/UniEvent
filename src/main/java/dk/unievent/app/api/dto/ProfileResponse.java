package dk.unievent.app.api.dto;

import java.util.List;

public record ProfileResponse(String role, List<String> organizerNames) {}
