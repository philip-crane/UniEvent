package dk.unievent.app.application.scheduler;

import dk.unievent.app.application.service.EventService;
import dk.unievent.app.application.service.PageService;
import dk.unievent.app.application.dto.PageDTO;
import dk.unievent.app.infrastructure.exception.FacebookApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;



/**
 * Scheduled task for ingesting Facebook events.
 * Runs every 12 hours to fetch upcoming events from all connected Facebook pages.
 *
 * Schedule: 43200000 ms = 12 hours
 * Retry on failure: Does not block on individual page failures
 * Logging: Detailed logging of successes and failures per page
 */
@Slf4j
@Component
public class FacebookIngestionScheduler {

    private final PageService pageService;
    private final EventService eventService;
    private static final int PAGE_SIZE = 50;
    private static final long INGESTION_INTERVAL = 43200000; // 12 hours in milliseconds

    public FacebookIngestionScheduler(
        PageService pageService,
        EventService eventService
    ) {
        this.pageService = pageService;
        this.eventService = eventService;
    }

    /**
     * Ingest Facebook events for all active pages.
     * Runs on a 12-hour schedule.
     * Processes pages in batches to avoid overwhelming the system.
     */
    @Scheduled(fixedDelay = INGESTION_INTERVAL, initialDelay = 60000) // Initial delay: 1 minute after startup
    public void ingestFacebookEvents() {
        log.info("Starting scheduled Facebook event ingestion");

        try {
            long startTime = System.currentTimeMillis();
            int successCount = 0;
            int failureCount = 0;

            // Process all active pages that have Facebook tokens
            // Pageable with page = 0, size = PAGE_SIZE for first batch
            int pageNumber = 0;
            boolean hasMorePages = true;

            while (hasMorePages) {
                Pageable pageable = PageRequest.of(pageNumber, PAGE_SIZE);
                Page<PageDTO> activePagesPage = pageService.getActivePages(pageable);

                for (PageDTO page : activePagesPage.getContent()) {
                    try {
                        log.debug("Ingesting events for page: {} ({})", page.getName(), page.getId());
                        eventService.ingestFacebookEvents(page.getId());
                        successCount++;
                        log.info("Successfully ingested events for page: {}", page.getId());
                    } catch (FacebookApiException e) {
                        failureCount++;
                        log.error("Facebook API error ingesting events for page: {} - {} ({})",
                            page.getId(), e.getErrorType(), e.getStatusCode());
                        // Continue with next page even if this one fails
                    } catch (Exception e) {
                        failureCount++;
                        log.error("Error ingesting events for page: {}", page.getId(), e);
                        // Continue with next page even if this one fails
                    }
                }

                // Check if there are more pages
                hasMorePages = activePagesPage.hasNext();
                pageNumber++;
            }

            long duration = System.currentTimeMillis() - startTime;
            log.info("Facebook event ingestion completed. Success: {}, Failure: {}, Duration: {}ms",
                successCount, failureCount, duration);

        } catch (Exception e) {
            log.error("Unexpected error in Facebook event ingestion scheduler", e);
            // Log but don't rethrow - scheduler should continue running even after errors
        }
    }
}
