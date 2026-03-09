package dk.unievent.web.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for Events - what the frontend receives
 * Matches the Event interface from web/src/types.ts
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    private String id;
    private String pageId;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private PlaceDTO place;
    private String coverImageUrl;
    private String eventURL;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
