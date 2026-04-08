package dk.unievent.app.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import dk.unievent.app.application.dto.PageDTO;
import dk.unievent.app.application.service.PageService;
import dk.unievent.app.db.model.PageEntity;
import dk.unievent.app.db.repository.PageRepository;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for Page (Organizer) operations
 * Tests full stack: Database ↔ Repository ↔ Service ↔ Mapper ↔ DTO
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PageIntegrationTests {
    
    @Autowired
    private PageRepository pageRepository;
    
    @Autowired
    private PageService pageService;
    
    // ============= Create Tests =============
    
    @Test
    void testCreatePageAndRetrieveAsDTO() {
        PageDTO createDTO = new PageDTO();
        createDTO.setId("page-new");
        createDTO.setName("New Organizer");
        
        PageDTO created = pageService.savePage(createDTO);
        
        assertNotNull(created);
        assertEquals("page-new", created.getId());
        assertEquals("New Organizer", created.getName());
        assertNull(created.getPictureId()); // No picture set
    }
    
    @Test
    void testPagePersistenceInDatabase() {
        PageDTO createDTO = new PageDTO();
        createDTO.setId("persist-test");
        createDTO.setName("Persist Test Page");
        
        pageService.savePage(createDTO);
        
        // Verify in database
        Optional<PageEntity> dbEntity = pageRepository.findById("persist-test");
        assertTrue(dbEntity.isPresent());
        assertEquals("Persist Test Page", dbEntity.get().getName());
    }
    
    // ============= Retrieve Tests =============
    
    @Test
    void testGetAllPagesThroughService() {
        createTestPage("page-1", "Page One");
        createTestPage("page-2", "Page Two");
        createTestPage("page-3", "Page Three");
        
        Page<PageDTO> allPages = pageService.getAllPages(PageRequest.of(0, 20));
        
        assertEquals(3, allPages.getContent().size());
        assertTrue(allPages.getContent().stream().anyMatch(p -> "Page One".equals(p.getName())));
        assertTrue(allPages.getContent().stream().anyMatch(p -> "Page Two".equals(p.getName())));
        assertTrue(allPages.getContent().stream().anyMatch(p -> "Page Three".equals(p.getName())));
    }
    
    @Test
    void testGetActivePages() {
        createDatabasePage("page-1", "Active Page", "valid");
        createDatabasePage("page-2", "Inactive Page", "expired");
        createDatabasePage("page-3", "Another Active", "valid");
        
        Page<PageDTO> activePages = pageService.getActivePages(PageRequest.of(0, 20));
        
        assertEquals(2, activePages.getContent().size());
        assertTrue(activePages.getContent().stream().allMatch(PageDTO::getActive));
    }
    
    @Test
    void testGetPageById() {
        createTestPage("page-search", "Search Me");
        
        PageDTO found = pageService.getPageById("page-search");
        
        assertNotNull(found);
        assertEquals("Search Me", found.getName());
    }
    
    @Test
    void testGetPageByIdNotFoundReturnsNull() {
        PageDTO notFound = pageService.getPageById("nonexistent");
        
        assertNull(notFound);
    }
    
    @Test
    void testSearchPagesByName() {
        createTestPage("page-1", "S-huset");
        createTestPage("page-2", "Pumpehuset");
        createTestPage("page-3", "Slotsholmen");
        
        Page<PageDTO> searchResults = pageService.searchPagesByName("s-huset", PageRequest.of(0, 20));
        
        assertEquals(1, searchResults.getContent().size());
        assertEquals("S-huset", searchResults.getContent().get(0).getName());
    }
    
    @Test
    void testSearchPagesByNamePartial() {
        createTestPage("page-1", "S-huset");
        createTestPage("page-2", "S-huset");
        createTestPage("page-3", "Pumpehuset");
        
        Page<PageDTO> searchResults = pageService.searchPagesByName("S-huset", PageRequest.of(0, 20));
        
        assertEquals(2, searchResults.getContent().size());
    }
    
    // ============= Update Tests =============
    
    @Test
    void testUpdatePageThroughService() {
        createTestPage("page-update", "Original Name");
        
        PageDTO updateDTO = new PageDTO();
        updateDTO.setId("page-update");
        updateDTO.setName("Updated Name");
        updateDTO.setPictureId(2L);
        
        PageDTO updated = pageService.savePage(updateDTO);
        
        assertNotNull(updated);
        assertEquals("Updated Name", updated.getName());
    }
    
    @Test
    void testUpdatePagePersistsToDatabase() {
        createTestPage("page-persist", "Before Update");
        
        PageDTO updateDTO = new PageDTO();
        updateDTO.setId("page-persist");
        updateDTO.setName("After Update");
        
        pageService.savePage(updateDTO);
        
        // Verify in database
        Optional<PageEntity> dbEntity = pageRepository.findById("page-persist");
        assertTrue(dbEntity.isPresent());
        assertEquals("After Update", dbEntity.get().getName());
    }
    
    // ============= Delete Tests =============
    
    @Test
    void testDeletePageThroughService() {
        createTestPage("page-delete", "Delete Me");
        
        boolean deleted = pageService.deletePage("page-delete");
        
        assertTrue(deleted);
        // Verify deleted from database
        assertFalse(pageRepository.findById("page-delete").isPresent());
    }
    
    @Test
    void testDeletePageNotFoundReturnsFalse() {
        boolean deleted = pageService.deletePage("nonexistent");
        
        assertFalse(deleted);
    }
    
    // ============= Helper Methods =============
    
    private PageDTO createTestPage(String id, String name) {
        PageDTO dto = new PageDTO();
        dto.setId(id);
        dto.setName(name);
        return pageService.savePage(dto);
    }
    
    private PageEntity createDatabasePage(String id, String name, String tokenStatus) {
        PageEntity entity = PageEntity.builder()
                .id(id)
                .name(name)
                .tokenStatus(tokenStatus)
                .tokenExpiresAt(LocalDateTime.now().plusDays(30))
                .build();
        return pageRepository.save(entity);
    }
}
