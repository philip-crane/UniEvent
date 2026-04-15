package dk.unievent.app.application.scheduler;

import dk.unievent.app.application.service.FacebookGraphApiService;
import dk.unievent.app.application.service.PageService;
import dk.unievent.app.application.service.VaultService;
import dk.unievent.app.db.model.PageEntity;
import dk.unievent.app.infrastructure.exception.FacebookApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Scheduled task for refreshing Facebook page access tokens.
 * Runs every 45 days to refresh long-lived tokens (~60-day expiration).
 *
 * Schedule: 3888000000 ms = 45 days in milliseconds
 * Token expiration: Facebook long-lived tokens expire after ~60 days
 * Refresh interval: 45 days ensures tokens don't expire before refresh
 * Retry logic: Per-page error logging, continues processing even if one page fails
 */
@Slf4j
@Component
public class FacebookTokenRefresher {

    private final PageService pageService;
    private final FacebookGraphApiService facebookGraphApiService;
    private final VaultService vaultService;
    private static final int PAGE_SIZE = 50;
    private static final long REFRESH_INTERVAL = 3888000000L; // 45 days in milliseconds

    public FacebookTokenRefresher(
        PageService pageService,
        FacebookGraphApiService facebookGraphApiService,
        VaultService vaultService
    ) {
        this.pageService = pageService;
        this.facebookGraphApiService = facebookGraphApiService;
        this.vaultService = vaultService;
    }

    /**
     * Refresh access tokens for all Facebook pages.
     * Runs on a 45-day schedule to refresh tokens before expiration (~60 days).
     * Processes pages in batches to avoid overwhelming the system.
     */
    @Scheduled(fixedDelay = REFRESH_INTERVAL, initialDelay = 120000) // Initial delay: 2 minutes after startup
    public void refreshPageTokens() {
        log.info("Starting scheduled Facebook page token refresh");

        try {
            long startTime = System.currentTimeMillis();
            int refreshedCount = 0;
            int failedCount = 0;

            // Refresh tokens for all pages that need refresh
            // This typically includes all pages with valid tokens
            int pageNumber = 0;
            boolean hasMorePages = true;

            while (hasMorePages) {
                Pageable pageable = PageRequest.of(pageNumber, PAGE_SIZE);
                Page<PageEntity> pagesToRefresh = pageService.getPagesToRefresh(pageable);

                for (PageEntity page : pagesToRefresh.getContent()) {
                    if (refreshPageToken(page.getId())) {
                        refreshedCount++;
                    } else {
                        failedCount++;
                    }
                }

                // Check if there are more pages
                hasMorePages = pagesToRefresh.hasNext();
                pageNumber++;
            }

            long duration = System.currentTimeMillis() - startTime;
            log.info("Facebook page token refresh completed. Refreshed: {}, Failed: {}, Duration: {}ms",
                refreshedCount, failedCount, duration);

        } catch (Exception e) {
            log.error("Unexpected error in Facebook token refresh scheduler", e);
            // Log but don't rethrow - scheduler should continue running even after errors
        }
    }

    /**
     * Refresh a single page's access token.
     * Retrieves old token from Vault, refreshes it via Graph API, stores new token.
     *
     * @param pageId Facebook page ID
     * @return true if token was successfully refreshed
     */
    private boolean refreshPageToken(String pageId) {
        log.debug("Refreshing token for page: {}", pageId);

        try {
            // Step 1: Retrieve current token from Vault
            Optional<String> currentTokenOpt = vaultService.getPageToken(pageId);
            if (currentTokenOpt.isEmpty()) {
                log.warn("No token found in Vault for page: {}", pageId);
                pageService.logRefreshFailure(pageId, "No token found in Vault");
                return false;
            }

            String currentToken = currentTokenOpt.get();
            log.debug("Retrieved token from Vault for page: {}", pageId);

            // Step 2: Call Facebook Graph API to refresh token
            try {
                String newToken = facebookGraphApiService.refreshPageToken(currentToken);
                log.debug("Obtained new token from Facebook for page: {}", pageId);

                // Step 3: Store new token in Vault
                vaultService.updatePageToken(pageId, newToken);
                log.debug("Stored new token in Vault for page: {}", pageId);

                // Step 4: Update page metadata in database
                pageService.refreshToken(pageId);
                log.info("Successfully refreshed token for page: {}", pageId);

                return true;

            } catch (FacebookApiException e) {
                log.error("Facebook API error refreshing token for page: {} - {} ({})",
                    pageId, e.getErrorType(), e.getStatusCode());
                pageService.logRefreshFailure(pageId,
                    String.format("Facebook API error: %s (status %d)", e.getErrorType(), e.getStatusCode()));
                return false;
            }

        } catch (Exception e) {
            log.error("Error refreshing token for page: {}", pageId, e);
            pageService.logRefreshFailure(pageId, e.getMessage());
            return false;
        }
    }
}
