package dk.unievent.app.api.controller;

import dk.unievent.app.infrastructure.seeding.DataSeederService;
import dk.unievent.app.infrastructure.seeding.SeedResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin controller for seeding and clearing test data.
 * Only for local development use.
 */
@Slf4j
@RestController
@RequestMapping("/admin/seed")
@Tag(name = "Admin - Seeding", description = "Local development - seed and clear test data")
@Profile("dev")
public class SeedDataController {

    private final DataSeederService dataSeederService;

    public SeedDataController(DataSeederService dataSeederService) {
        this.dataSeederService = dataSeederService;
    }

    @PostMapping
    @Operation(summary = "Seed test data", description = "Insert minimal test data (2 pages, 10 events, 2 places) for local development")
    @ApiResponse(responseCode = "200", description = "Test data seeded successfully")
    @ApiResponse(responseCode = "500", description = "Error during seeding")
    public ResponseEntity<SeedResult> seedData() {
        log.info("Received seed data request");
        SeedResult result = dataSeederService.seedData();
        
        if (result.isSuccess()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }

    @DeleteMapping
    @Operation(summary = "Clear seeded test data", description = "Remove all test data marked with SEED_ prefix")
    @ApiResponse(responseCode = "200", description = "Test data cleared successfully")
    @ApiResponse(responseCode = "500", description = "Error during cleanup")
    public ResponseEntity<SeedResult> clearSeedData() {
        log.info("Received clear seed data request");
        SeedResult result = dataSeederService.clearSeedData();
        
        if (result.isSuccess()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
}
