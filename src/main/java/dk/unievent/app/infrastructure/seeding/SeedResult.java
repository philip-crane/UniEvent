package dk.unievent.app.infrastructure.seeding;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Result of a seed or cleanup operation.
 */
@Getter
@AllArgsConstructor
public class SeedResult {
    private final boolean success;
    private final String message;
    private final long pageCount;
    private final long eventCount;
    private final long placeCount;
}
