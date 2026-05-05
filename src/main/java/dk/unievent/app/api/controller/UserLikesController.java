package dk.unievent.app.api.controller;

import dk.unievent.app.api.dto.LikedEventsRequest;
import dk.unievent.app.api.dto.LikedEventsResponse;
import dk.unievent.app.application.service.UserLikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me/likes")
@RequiredArgsConstructor
@Tag(name = "User Likes", description = "Persist liked events for the authenticated user")
public class UserLikesController {

    private final UserLikeService userLikeService;

    @GetMapping
    @Operation(summary = "Get liked event IDs for the current user")
    public ResponseEntity<LikedEventsResponse> getLikes(Authentication authentication) {
        return ResponseEntity.ok(new LikedEventsResponse(userLikeService.getLikedEventIds(authentication.getName())));
    }

    @PostMapping
    @Operation(summary = "Merge liked event IDs for the current user")
    public ResponseEntity<LikedEventsResponse> mergeLikes(
            Authentication authentication,
            @Valid @RequestBody LikedEventsRequest request) {
        return ResponseEntity.ok(new LikedEventsResponse(userLikeService.mergeLikedEventIds(authentication.getName(), request.eventIds())));
    }

    @PutMapping("/{eventId}")
    @Operation(summary = "Like an event for the current user")
    public ResponseEntity<LikedEventsResponse> likeEvent(
            Authentication authentication,
            @PathVariable String eventId) {
        return ResponseEntity.ok(new LikedEventsResponse(userLikeService.likeEvent(authentication.getName(), eventId)));
    }

    @DeleteMapping("/{eventId}")
    @Operation(summary = "Unlike an event for the current user")
    public ResponseEntity<LikedEventsResponse> unlikeEvent(
            Authentication authentication,
            @PathVariable String eventId) {
        return ResponseEntity.ok(new LikedEventsResponse(userLikeService.unlikeEvent(authentication.getName(), eventId)));
    }
}
