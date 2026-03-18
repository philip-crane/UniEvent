package dk.unievent.web.controller;

import dk.unievent.web.entity.Event;
import dk.unievent.web.entity.Page;
import dk.unievent.web.repository.EventRepository;
import dk.unievent.web.repository.PageRepository;
import dk.unievent.web.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class EventController {

    private final FacebookService facebookService;
    private final PageRepository pageRepository;
    private final EventRepository eventRepository;
    private final SecretManagerService secretManagerService;
    private final StorageService storageService;
    private final ObjectMapper objectMapper;

    public EventController(FacebookService facebookService, PageRepository pageRepository,
                          EventRepository eventRepository, SecretManagerService secretManagerService,
                          StorageService storageService, ObjectMapper objectMapper) {
        this.facebookService = facebookService;
        this.pageRepository = pageRepository;
        this.eventRepository = eventRepository;
        this.secretManagerService = secretManagerService;
        this.storageService = storageService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/callback")
    public ResponseEntity<Map<String, Object>> handleCallback(@RequestBody Map<String, String> input) {
        String code = input.get("code");
        boolean debug = Boolean.parseBoolean(input.get("debug"));

        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Missing code"));
        }

        try {
            String shortLivedToken = facebookService.getShortLivedToken(code);
            FacebookService.LongLivedToken longLivedToken = facebookService.getLongLivedToken(shortLivedToken);
            List<FacebookService.FacebookPage> pages = facebookService.getPagesFromUser(longLivedToken.accessToken());

            if (pages.isEmpty()) {
                return ResponseEntity.ok(Map.of("success", true, "storedPages", 0, "message", "No pages returned."));
            }

            int storedPages = 0;
            for (FacebookService.FacebookPage fbPage : pages) {
                try {
                    secretManagerService.addPageToken(fbPage.id(), fbPage.accessToken(), longLivedToken.expiresIn());

                    Page page = new Page();
                    page.setId(fbPage.id());
                    page.setName(fbPage.name());
                    page.setActive(true);
                    page.setUrl("https://facebook.com/" + fbPage.id());
                    page.setConnectedAt(Instant.now());
                    page.setTokenRefreshedAt(Instant.now());
                    page.setTokenStoredAt(Instant.now());
                    page.setTokenExpiresAt(Instant.now().plusSeconds(longLivedToken.expiresIn()));
                    page.setTokenExpiresInDays((long) Math.ceil(longLivedToken.expiresIn() / (60.0 * 60 * 24)));
                    page.setTokenStatus("valid");
                    page.setLastRefreshSuccess(true);

                    pageRepository.save(page);
                    storedPages++;
                } catch (Exception e) {
                    // Log error
                }
            }

            return ResponseEntity.ok(Map.of("success", true, "storedPages", storedPages, "message", "Stored " + storedPages + " page token(s)."));
        } catch (Exception e) {
            String msg = e.getMessage();
            return ResponseEntity.status(500).body(Map.of("success", false, "error", msg, "message", debug ? msg : "Facebook auth failed"));
        }
    }

    @PostMapping("/ingest")
    public ResponseEntity<Map<String, Object>> handleIngest() {
        try {
            List<Page> pages = pageRepository.findAll();
            if (pages.isEmpty()) {
                return ResponseEntity.ok(Map.of("totalPages", 0, "totalEvents", 0, "duration", 0));
            }

            long startTime = System.currentTimeMillis();
            int totalEventsProcessed = 0;
            List<Map<String, Object>> pageResults = new ArrayList<>();

            for (Page page : pages) {
                long pageStartTime = System.currentTimeMillis();
                try {
                    String token = secretManagerService.getPageToken(page.getId());
                    if (token == null) {
                        pageResults.add(Map.of(
                            "pageId", page.getId(),
                            "pageName", page.getName(),
                            "status", "skipped",
                            "reason", "no_token",
                            "duration", System.currentTimeMillis() - pageStartTime
                        ));
                        continue;
                    }

                    List<FacebookService.FbEventResponse> events = facebookService.getPageEvents(page.getId(), token);
                    if (events.isEmpty()) {
                        pageResults.add(Map.of(
                            "pageId", page.getId(),
                            "pageName", page.getName(),
                            "status", "success",
                            "eventsProcessed", 0,
                            "eventsFailed", 0,
                            "duration", System.currentTimeMillis() - pageStartTime
                        ));
                        continue;
                    }

                    List<Event> eventsData = new ArrayList<>();
                    for (FacebookService.FbEventResponse fbEvent : events) {
                        try {
                            String coverImageUrl = null;
                            if (fbEvent.cover() != null && fbEvent.cover().source() != null) {
                                coverImageUrl = storageService.addImageFromUrl("covers/" + page.getId() + "/" + fbEvent.id(), fbEvent.cover().source().source());
                            }

                            String placeJson = null;
                            if (fbEvent.place() != null) {
                                try {
                                    placeJson = objectMapper.writeValueAsString(fbEvent.place());
                                } catch (Exception e) {
                                    // If serialization fails, store as string representation
                                    placeJson = fbEvent.place().toString();
                                }
                            }

                            Instant eventStartTime = null;
                            Instant eventEndTime = null;
                            try {
                                eventStartTime = Instant.parse(fbEvent.start_time());
                            } catch (Exception e) {
                                // If parsing fails, keep as null
                            }
                            try {
                                eventEndTime = Instant.parse(fbEvent.end_time());
                            } catch (Exception e) {
                                // If parsing fails, keep as null
                            }

                            String rawJson = null;
                            try {
                                rawJson = objectMapper.writeValueAsString(fbEvent);
                            } catch (Exception e) {
                                // If serialization fails, skip
                            }

                            Event event = new Event();
                            event.setId(fbEvent.id());
                            event.setPageId(page.getId());
                            event.setTitle(fbEvent.name());
                            event.setDescription(fbEvent.description());
                            event.setStartTime(eventStartTime);
                            event.setEndTime(eventEndTime);
                            event.setPlace(placeJson);
                            event.setCoverImageUrl(coverImageUrl);
                            event.setEventURL("https://facebook.com/events/" + fbEvent.id());
                            event.setCreatedAt(Instant.now());
                            event.setUpdatedAt(Instant.now());
                            event.setRaw(rawJson);
                            eventsData.add(event);
                        } catch (Exception e) {
                            // Handle error
                        }
                    }

                    eventRepository.saveAll(eventsData);
                    totalEventsProcessed += eventsData.size();
                    pageResults.add(Map.of(
                        "pageId", page.getId(),
                        "pageName", page.getName(),
                        "status", "success",
                        "eventsProcessed", eventsData.size(),
                        "eventsFailed", events.size() - eventsData.size(),
                        "duration", System.currentTimeMillis() - pageStartTime
                    ));
                } catch (Exception e) {
                    pageResults.add(Map.of(
                        "pageId", page.getId(),
                        "pageName", page.getName(),
                        "status", "failed",
                        "error", e.getMessage(),
                        "duration", System.currentTimeMillis() - pageStartTime
                    ));
                }
            }

            return ResponseEntity.ok(Map.of(
                "totalPages", pages.size(),
                "totalEvents", totalEventsProcessed,
                "duration", System.currentTimeMillis() - startTime,
                "pageResults", pageResults
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/refresh-tokens")
    public ResponseEntity<Map<String, Object>> handleRefreshTokens() {
        try {
            List<Page> pages = pageRepository.findAll();
            if (pages.isEmpty()) {
                return ResponseEntity.ok(Map.of("tokensRefreshed", 0, "tokensFailed", 0, "durationMs", 0));
            }

            long startTime = System.currentTimeMillis();
            int tokensRefreshed = 0;
            int tokensFailed = 0;

            for (Page page : pages) {
                try {
                    String currentToken = secretManagerService.getPageToken(page.getId());
                    if (currentToken == null) {
                        throw new RuntimeException("No token found");
                    }

                    FacebookService.LongLivedToken refreshedToken = facebookService.refreshPageToken(currentToken);
                    secretManagerService.updatePageToken(page.getId(), refreshedToken.accessToken(), refreshedToken.expiresIn());

                    page.setTokenRefreshedAt(Instant.now());
                    page.setLastRefreshSuccess(true);
                    page.setLastRefreshError(null);
                    pageRepository.save(page);
                    tokensRefreshed++;
                } catch (Exception e) {
                    tokensFailed++;
                    try {
                        page.setLastRefreshSuccess(false);
                        page.setLastRefreshError(e.getMessage());
                        page.setLastRefreshAttempt(Instant.now());
                        pageRepository.save(page);
                    } catch (Exception dbErr) {
                        // Silent fail
                    }
                }
            }

            return ResponseEntity.ok(Map.of(
                "tokensRefreshed", tokensRefreshed,
                "tokensFailed", tokensFailed,
                "durationMs", System.currentTimeMillis() - startTime
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}