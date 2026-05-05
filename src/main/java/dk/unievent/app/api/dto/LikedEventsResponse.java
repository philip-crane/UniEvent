package dk.unievent.app.api.dto;

import java.util.List;

public record LikedEventsResponse(List<String> eventIds) {
}
