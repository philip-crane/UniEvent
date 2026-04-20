package dk.unievent.app.application.scheduler;

import dk.unievent.app.tools.services.TokenRefreshService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled task for refreshing Facebook page access tokens.
 * Runs every 45 days to refresh long-lived tokens (~60-day expiration).
 * Delegates the actual work to TokenRefreshService so the same logic is
 * reachable via the manual /admin/tools/refresh-tokens endpoint.
 */
@Slf4j
@Component
public class FacebookTokenRefresher {

    private static final long REFRESH_INTERVAL = 3888000000L; // 45 days in ms

    private final TokenRefreshService tokenRefreshService;

    public FacebookTokenRefresher(TokenRefreshService tokenRefreshService) {
        this.tokenRefreshService = tokenRefreshService;
    }

    @Scheduled(fixedDelay = REFRESH_INTERVAL, initialDelay = 120000)
    public void refreshPageTokens() {
        try {
            tokenRefreshService.refreshAll();
        } catch (Exception e) {
            log.error("Unexpected error in Facebook token refresh scheduler", e);
        }
    }
}
