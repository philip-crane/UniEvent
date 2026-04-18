package dk.unievent.app.application.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import dk.unievent.app.application.dto.LocationDTO;
import dk.unievent.app.application.dto.PlaceDTO;
import dk.unievent.app.db.model.PlaceEntity;
import dk.unievent.app.db.repository.PlaceRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for Place (Venue) operations
 * Tests full stack: Database ↔ Repository ↔ Service ↔ Mapper ↔ DTO
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PlaceIntegrationTests {
    
    @Autowired
    private PlaceRepository placeRepository;
    
    @Autowired
    private PlaceService placeService;
    
    // ============= Create Tests =============
    
    @Test
    void testCreatePlaceAndRetrieveAsDTO() {
        PlaceDTO createDTO = createPlaceDTO("venue-1", "New Venue", "Main St", "Copenhagen");
        
        PlaceDTO created = placeService.createPlace(createDTO);
        
        assertNotNull(created);
        assertEquals("venue-1", created.getId());
        assertEquals("New Venue", created.getName());
        assertEquals("Copenhagen", created.getLocation().getCity());
    }
    
    @Test
    void testPlacePersistenceInDatabase() {
        PlaceDTO createDTO = createPlaceDTO("persist-venue", "Persist Venue", "Street 1", "Aarhus");
        
        placeService.createPlace(createDTO);
        
        // Verify in database
        Optional<PlaceEntity> dbEntity = placeRepository.findById("persist-venue");
        assertTrue(dbEntity.isPresent());
        assertEquals("Persist Venue", dbEntity.get().getName());
        assertEquals("Street 1", dbEntity.get().getStreet());
        assertEquals("Aarhus", dbEntity.get().getCity());
    }
    
    // ============= Retrieve Tests =============
    
    @Test
    void testGetPlaceById() {
        createTestPlace("place-find", "Find Me Venue", "Find St", "Odense");
        
        Optional<PlaceDTO> found = placeService.getPlaceById("place-find");

        assertTrue(found.isPresent());
        assertEquals("Find Me Venue", found.get().getName());
        assertEquals("Odense", found.get().getLocation().getCity());
    }
    
    @Test
    void testGetPlaceByIdNotFoundReturnsNull() {
        Optional<PlaceDTO> notFound = placeService.getPlaceById("nonexistent");

        assertTrue(notFound.isEmpty());
    }
    
    @Test
    void testGetPlacesByCity() {
        createTestPlace("place-cph-1", "Venue CPH 1", "Street 1", "Copenhagen");
        createTestPlace("place-cph-2", "Venue CPH 2", "Street 2", "Copenhagen");
        createTestPlace("place-aarhus", "Venue Aarhus", "Street 3", "Aarhus");
        
        Page<PlaceDTO> cphPlaces = placeService.getPlacesByCity("Copenhagen", PageRequest.of(0, 20));
        Page<PlaceDTO> aarhusPlaces = placeService.getPlacesByCity("Aarhus", PageRequest.of(0, 20));
        
        assertEquals(2, cphPlaces.getContent().size());
        assertEquals(1, aarhusPlaces.getContent().size());
        assertTrue(cphPlaces.getContent().stream().allMatch(p -> "Copenhagen".equals(p.getLocation().getCity())));
    }
    
    @Test
    void testGetPlacesByCountry() {
        createTestPlace("place-dk-1", "Venue Denmark 1", "Street 1", "Copenhagen", "Denmark");
        createTestPlace("place-dk-2", "Venue Denmark 2", "Street 2", "Aarhus", "Denmark");
        createTestPlace("place-se", "Venue Sweden", "Street 3", "Stockholm", "Sweden");
        
        Page<PlaceDTO> danishPlaces = placeService.getPlacesByCountry("Denmark", PageRequest.of(0, 20));
        Page<PlaceDTO> swedishPlaces = placeService.getPlacesByCountry("Sweden", PageRequest.of(0, 20));
        
        assertEquals(2, danishPlaces.getContent().size());
        assertEquals(1, swedishPlaces.getContent().size());
        assertTrue(danishPlaces.getContent().stream().allMatch(p -> "Denmark".equals(p.getLocation().getCountry())));
    }
    
    @Test
    void testGetPlacesByCityAndCountry() {
        createTestPlace("place-cph-dk", "Venue Copenhagen", "Street 1", "Copenhagen", "Denmark");
        createTestPlace("place-cph-se", "Venue Stockholm", "Street 2", "Stockholm", "Sweden");
        
        Page<PlaceDTO> cphDkPlaces = placeService.getPlacesByCityAndCountry("Copenhagen", "Denmark", PageRequest.of(0, 20));
        Page<PlaceDTO> stockholmPlaces = placeService.getPlacesByCityAndCountry("Stockholm", "Sweden", PageRequest.of(0, 20));
        Page<PlaceDTO> noMatch = placeService.getPlacesByCityAndCountry("Paris", "France", PageRequest.of(0, 20));
        
        assertEquals(1, cphDkPlaces.getContent().size());
        assertEquals(1, stockholmPlaces.getContent().size());
        assertEquals(0, noMatch.getContent().size());
    }
    
    @Test
    void testSearchPlacesByName() {
        createTestPlace("place-1", "S-huset", "Street 1", "Copenhagen");
        createTestPlace("place-2", "Slotsholmen", "Street 2", "Copenhagen");
        createTestPlace("place-3", "Pumpehuset", "Street 3", "Copenhagen");
        
        Page<PlaceDTO> searchResults = placeService.searchByName("s-huset", PageRequest.of(0, 20));
        
        assertEquals(1, searchResults.getContent().size());
        assertEquals("S-huset", searchResults.getContent().get(0).getName());
    }
    
    @Test
    void testSearchPlacesByNamePartial() {
        createTestPlace("place-1", "S-huset", "Street 1", "Copenhagen");
        createTestPlace("place-2", "S-huset", "Street 2", "Copenhagen");
        createTestPlace("place-3", "Pumpehuset", "Street 3", "Copenhagen");
        
        Page<PlaceDTO> searchResults = placeService.searchByName("S-huset", PageRequest.of(0, 20));
        
        assertEquals(2, searchResults.getContent().size());
    }
    
    // ============= Update Tests =============
    
    @Test
    void testUpdatePlaceThroughService() {
        createTestPlace("place-update", "Original Name", "Street 1", "Copenhagen");
        
        PlaceDTO updateDTO = new PlaceDTO();
        updateDTO.setId("place-update");
        updateDTO.setName("Updated Name");
        
        LocationDTO updateLocation = new LocationDTO();
        updateLocation.setStreet("Updated Street");
        updateLocation.setCity("Aarhus");
        updateLocation.setCountry("Denmark");
        updateDTO.setLocation(updateLocation);
        
        Optional<PlaceDTO> updated = placeService.updatePlace("place-update", updateDTO);

        assertTrue(updated.isPresent());
        assertEquals("Updated Name", updated.get().getName());
        assertEquals("Updated Street", updated.get().getLocation().getStreet());
        assertEquals("Aarhus", updated.get().getLocation().getCity());
    }
    
    @Test
    void testUpdatePlaceNotFoundReturnsNull() {
        PlaceDTO updateDTO = new PlaceDTO();
        updateDTO.setName("New Name");
        
        Optional<PlaceDTO> result = placeService.updatePlace("nonexistent", updateDTO);

        assertTrue(result.isEmpty());
    }
    
    @Test
    void testUpdatePlacePersistsToDatabase() {
        createTestPlace("place-persist", "Before Update", "Street 1", "Copenhagen");
        
        PlaceDTO updateDTO = new PlaceDTO();
        updateDTO.setName("After Update");
        updateDTO.setLocation(new LocationDTO());
        
        placeService.updatePlace("place-persist", updateDTO);
        
        // Verify in database
        Optional<PlaceEntity> dbEntity = placeRepository.findById("place-persist");
        assertTrue(dbEntity.isPresent());
        assertEquals("After Update", dbEntity.get().getName());
    }
    
    // ============= Delete Tests =============
    
    @Test
    void testDeletePlaceThroughService() {
        createTestPlace("place-delete", "Delete Me", "Street 1", "Copenhagen");
        
        boolean deleted = placeService.deletePlace("place-delete");
        
        assertTrue(deleted);
        // Verify deleted from database
        assertFalse(placeRepository.findById("place-delete").isPresent());
    }
    
    @Test
    void testDeletePlaceNotFoundReturnsFalse() {
        boolean deleted = placeService.deletePlace("nonexistent");
        
        assertFalse(deleted);
    }
    
    // ============= Location Field Tests =============
    
    @Test
    void testPlaceWithCompleteLocationFields() {
        PlaceDTO dto = new PlaceDTO();
        dto.setId("place-complete");
        dto.setName("Complete Venue");
        
        LocationDTO location = new LocationDTO();
        location.setStreet("Main Street 123");
        location.setCity("Copenhagen");
        location.setZip("2100");
        location.setCountry("Denmark");
        location.setLatitude(55.6761);
        location.setLongitude(12.5883);
        dto.setLocation(location);
        
        placeService.createPlace(dto);
        Optional<PlaceDTO> retrieved = placeService.getPlaceById("place-complete");

        assertTrue(retrieved.isPresent());
        assertEquals("Main Street 123", retrieved.get().getLocation().getStreet());
        assertEquals("2100", retrieved.get().getLocation().getZip());
        assertEquals(55.6761, retrieved.get().getLocation().getLatitude());
        assertEquals(12.5883, retrieved.get().getLocation().getLongitude());
    }
    
    // ============= Helper Methods =============
    
    private PlaceDTO createPlaceDTO(String id, String name, String street, String city) {
        PlaceDTO dto = new PlaceDTO();
        dto.setId(id);
        dto.setName(name);
        
        LocationDTO location = new LocationDTO();
        location.setStreet(street);
        location.setCity(city);
        location.setCountry("Denmark");
        dto.setLocation(location);
        
        return dto;
    }
    
    private PlaceDTO createPlaceDTO(String id, String name, String street, String city, String country) {
        PlaceDTO dto = createPlaceDTO(id, name, street, city);
        dto.getLocation().setCountry(country);
        return dto;
    }
    
    private PlaceDTO createTestPlace(String id, String name, String street, String city) {
        return placeService.createPlace(createPlaceDTO(id, name, street, city));
    }
    
    private PlaceDTO createTestPlace(String id, String name, String street, String city, String country) {
        return placeService.createPlace(createPlaceDTO(id, name, street, city, country));
    }
}
