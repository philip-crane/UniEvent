package dk.unievent.app.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Centralized configuration for pagination constants.
 * Controls default and maximum page sizes across all paginated endpoints.
 */
@Component
@ConfigurationProperties(prefix = "app.pagination")
public class PaginationConstantsConfig {
    
    /**
     * Default page size when no size parameter is provided
     */
    private int defaultPageSize = 20;
    
    /**
     * Maximum allowed page size to prevent resource exhaustion
     */
    private int maxPageSize = 100;

    public int getDefaultPageSize() {
        return defaultPageSize;
    }

    public void setDefaultPageSize(int defaultPageSize) {
        this.defaultPageSize = defaultPageSize;
    }

    public int getMaxPageSize() {
        return maxPageSize;
    }

    public void setMaxPageSize(int maxPageSize) {
        this.maxPageSize = maxPageSize;
    }
}
