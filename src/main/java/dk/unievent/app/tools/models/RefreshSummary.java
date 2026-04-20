package dk.unievent.app.tools.models;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RefreshSummary {
    private final int refreshedCount;
    private final int failedCount;
    private final long durationMs;
}
