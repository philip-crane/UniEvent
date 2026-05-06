package dk.unievent.app.tools.controller;

import dk.unievent.app.application.service.EventService;
import dk.unievent.app.application.service.TokenRefreshService;
import dk.unievent.app.db.model.EventEntity;
import dk.unievent.app.db.repository.PageRepository;
import dk.unievent.app.tools.models.RefreshSummary;
import dk.unievent.app.tools.models.SeedResponse;
import dk.unievent.app.tools.services.SeedService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminToolsWorkflowTests {

    @Mock
    private SeedService seedService;

    @Mock
    private EventService eventService;

    @Mock
    private TokenRefreshService tokenRefreshService;

    @Mock
    private PageRepository pageRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
            new SeedController(seedService),
            new IngestController(eventService, pageRepository),
            new TokenController(tokenRefreshService, pageRepository)
        ).build();
    }

    @Test
    void adminToolsShouldSupportSeedIngestRefreshAndClearWorkflow() throws Exception {
        EventEntity importedEvent = EventEntity.builder()
            .id("evt-1")
            .title("Imported Facebook Event")
            .build();

        when(seedService.seedData())
            .thenReturn(new SeedResponse(true, "Seed data created successfully", 2, 10, 2));
        when(pageRepository.existsById("SEED_PAGE_001")).thenReturn(true);
        when(eventService.ingestFacebookEvents("SEED_PAGE_001")).thenReturn(List.of(importedEvent));
        when(tokenRefreshService.refreshAllForce()).thenReturn(new RefreshSummary(2, 0, 120L));
        when(seedService.clearSeedData())
            .thenReturn(new SeedResponse(true, "Seed data cleared successfully", 2, 10, 2));

        mockMvc.perform(post("/admin/tools/seed"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.eventCount").value(10));

        mockMvc.perform(post("/admin/tools/ingest/SEED_PAGE_001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.pageId").value("SEED_PAGE_001"))
            .andExpect(jsonPath("$.eventCount").value(1))
            .andExpect(jsonPath("$.eventTitles[0]").value("Imported Facebook Event"));

        mockMvc.perform(post("/admin/tools/refresh-tokens"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.refreshedCount").value(2))
            .andExpect(jsonPath("$.failedCount").value(0));

        mockMvc.perform(delete("/admin/tools/seed"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("Seed data cleared successfully"));

        InOrder workflow = inOrder(seedService, pageRepository, eventService, tokenRefreshService);
        workflow.verify(seedService).seedData();
        workflow.verify(pageRepository).existsById("SEED_PAGE_001");
        workflow.verify(eventService).ingestFacebookEvents("SEED_PAGE_001");
        workflow.verify(tokenRefreshService).refreshAllForce();
        workflow.verify(seedService).clearSeedData();
    }
}
