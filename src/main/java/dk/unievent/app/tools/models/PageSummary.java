package dk.unievent.app.tools.models;

import dk.unievent.app.db.model.PageEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Admin-only page summary including token metadata.
 * Exposed via /admin/tools/pages for the CLI page-picker.
 */
@Getter
@AllArgsConstructor
public class PageSummary {
    private final String id;
    private final String name;
    private final String tokenStatus;
    private final Integer tokenExpiresInDays;

    public static PageSummary from(PageEntity entity) {
        return new PageSummary(
            entity.getId(),
            entity.getName(),
            entity.getTokenStatus(),
            entity.getTokenExpiresInDays()
        );
    }
}
