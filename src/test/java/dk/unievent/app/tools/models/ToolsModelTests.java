package dk.unievent.app.tools.models;

import dk.unievent.app.db.model.PageEntity;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ToolsModelTests {

    @Test
    void ingestResponseShouldExposeAllFields() {
        IngestResponse response = new IngestResponse("p1", 3, List.of("Event A", "Event B", "Event C"));

        assertEquals("p1", response.getPageId());
        assertEquals(3, response.getEventCount());
        assertEquals(List.of("Event A", "Event B", "Event C"), response.getEventTitles());
    }

    @Test
    void pageSummaryShouldExposeAllFields() {
        PageSummary summary = new PageSummary("p2", "My Page", "active", 14);

        assertEquals("p2", summary.getId());
        assertEquals("My Page", summary.getName());
        assertEquals("active", summary.getTokenStatus());
        assertEquals(14, summary.getTokenExpiresInDays());
    }

    @Test
    void pageSummaryFromEntityShouldMapCorrectly() {
        PageEntity entity = new PageEntity();
        entity.setId("p3");
        entity.setName("Event Page");
        entity.setTokenStatus("error");
        entity.setTokenExpiresInDays(7);

        PageSummary summary = PageSummary.from(entity);

        assertEquals("p3", summary.getId());
        assertEquals("Event Page", summary.getName());
        assertEquals("error", summary.getTokenStatus());
        assertEquals(7, summary.getTokenExpiresInDays());
    }

    @Test
    void pageSummaryFromEntityShouldHandleNullExpiry() {
        PageEntity entity = new PageEntity();
        entity.setId("p4");
        entity.setName("Page");
        entity.setTokenStatus("invalid");
        entity.setTokenExpiresInDays(null);

        PageSummary summary = PageSummary.from(entity);

        assertNull(summary.getTokenExpiresInDays());
    }

    @Test
    void refreshResultShouldExposeAllFields() {
        RefreshResult result = new RefreshResult("p5", true, "Token refreshed");

        assertEquals("p5", result.getPageId());
        assertTrue(result.isSuccess());
        assertEquals("Token refreshed", result.getMessage());
    }

    @Test
    void refreshResultFailureShouldExposeAllFields() {
        RefreshResult result = new RefreshResult("p6", false, "Vault unavailable");

        assertFalse(result.isSuccess());
        assertEquals("Vault unavailable", result.getMessage());
    }

    @Test
    void refreshSummaryShouldExposeAllFields() {
        RefreshSummary summary = new RefreshSummary(5, 1, 320L);

        assertEquals(5, summary.getRefreshedCount());
        assertEquals(1, summary.getFailedCount());
        assertEquals(320L, summary.getDurationMs());
    }

    @Test
    void seedResponseShouldExposeAllFields() {
        SeedResponse response = new SeedResponse(true, "Seed complete", 3L, 10L, 5L);

        assertTrue(response.isSuccess());
        assertEquals("Seed complete", response.getMessage());
        assertEquals(3L, response.getPageCount());
        assertEquals(10L, response.getEventCount());
        assertEquals(5L, response.getPlaceCount());
    }
}
