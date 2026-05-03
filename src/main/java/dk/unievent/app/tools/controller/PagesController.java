package dk.unievent.app.tools.controller;

import dk.unievent.app.db.repository.PageRepository;
import dk.unievent.app.tools.models.PageSummary;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Lists Facebook pages tracked by the app - used by the `tools ingest` picker
 * so an operator can pick which page to ingest from.
 */
@Slf4j
@RestController
@RequestMapping("/admin/tools/pages")
@Tag(name = "Admin Tools - Pages", description = "List tracked Facebook pages")
@PreAuthorize("hasRole('admin')")
public class PagesController {

    private final PageRepository pageRepository;

    public PagesController(PageRepository pageRepository) {
        this.pageRepository = pageRepository;
    }

    @GetMapping
    @Operation(summary = "List all tracked pages", description = "Returns id, name, token status, and days-to-expiry for every page - including those with expired tokens so operators can inspect why a refresh would fail.")
    public ResponseEntity<List<PageSummary>> list() {
        log.info("Received list-pages request");
        List<PageSummary> summaries = pageRepository
            .findAllByOrderByNameAsc(PageRequest.of(0, 500))
            .map(PageSummary::from)
            .getContent()
            .stream()
            .toList();
        return ResponseEntity.ok(summaries);
    }
}
