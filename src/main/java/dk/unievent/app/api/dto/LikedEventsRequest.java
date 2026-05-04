package dk.unievent.app.api.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record LikedEventsRequest(@NotNull List<String> eventIds) {
}
