package dk.unievent.app.tools.controller;

import dk.unievent.app.tools.models.SeedResponse;
import dk.unievent.app.tools.services.SeedService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SeedControllerTests {

    @Mock
    private SeedService seedService;

    @InjectMocks
    private SeedController seedController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(seedController).build();
    }

    @Test
    void seedShouldReturn200OnSuccess() throws Exception {
        SeedResponse response = new SeedResponse(true, "Seed data created successfully", 2, 10, 2);
        when(seedService.seedData()).thenReturn(response);

        mockMvc.perform(post("/admin/tools/seed"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("Seed data created successfully"))
            .andExpect(jsonPath("$.pageCount").value(2))
            .andExpect(jsonPath("$.eventCount").value(10))
            .andExpect(jsonPath("$.placeCount").value(2));
    }

    @Test
    void seedShouldReturn500OnFailure() throws Exception {
        SeedResponse response = new SeedResponse(false, "Error during seed operation: db error", 0, 0, 0);
        when(seedService.seedData()).thenReturn(response);

        mockMvc.perform(post("/admin/tools/seed"))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Error during seed operation: db error"));
    }

    @Test
    void clearShouldReturn200OnSuccess() throws Exception {
        SeedResponse response = new SeedResponse(true, "Seed data cleared successfully", 2, 10, 2);
        when(seedService.clearSeedData()).thenReturn(response);

        mockMvc.perform(delete("/admin/tools/seed"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("Seed data cleared successfully"));
    }

    @Test
    void clearShouldReturn500OnFailure() throws Exception {
        SeedResponse response = new SeedResponse(false, "Error during cleanup operation: db error", 0, 0, 0);
        when(seedService.clearSeedData()).thenReturn(response);

        mockMvc.perform(delete("/admin/tools/seed"))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Error during cleanup operation: db error"));
    }
}
