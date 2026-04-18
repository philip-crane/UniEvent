package dk.unievent.app.db.repository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import dk.unievent.app.db.model.PlaceEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PlaceRepositoryTests {

    private static final Pageable DEFAULT_PAGEABLE = PageRequest.of(0, 20);

    @Autowired
    private PlaceRepository placeRepository;
    
    private PlaceEntity testPlace;
    
    @BeforeEach
    void setUp() {
        testPlace = PlaceEntity.builder()
                .id("place-1")
                .name("Test Place")
                .street("123 Test Street")
                .city("Test City")
                .zip("12345")
                .country("Test Country")
                .latitude(55.6761)
                .longitude(12.5883)
                .build();
        placeRepository.save(testPlace);

    }
    
    @Test
    void testSavePlace() {
        PlaceEntity place = PlaceEntity.builder()
                .id("place-2")
                .name("New Place")
                .city("New City")
                .country("New Country")
                .build();
        
        PlaceEntity savedPlace = placeRepository.save(place);
        
        assertNotNull(savedPlace);
        assertEquals("place-2", savedPlace.getId());
        assertEquals("New Place", savedPlace.getName());
        assertNotNull(savedPlace.getCreatedAt());
    }
    
    @Test
    void testFindPlaceById() {
        Optional<PlaceEntity> foundPlace = placeRepository.findById("place-1");
        
        assertTrue(foundPlace.isPresent());
        assertEquals("Test Place", foundPlace.get().getName());
        assertEquals("place-1", foundPlace.get().getId());
    }
    
    @Test
    void testFindPlaceByIdNotFound() {
        Optional<PlaceEntity> foundPlace = placeRepository.findById("non-existent");
        
        assertTrue(foundPlace.isEmpty());
    }
    
    @Test
    void testFindAllPlaces() {
        PlaceEntity place2 = PlaceEntity.builder()
                .id("place-2")
                .name("Second Place")
                .city("City 2")
                .country("Country 2")
                .build();
        placeRepository.save(place2);

        
        List<PlaceEntity> places = placeRepository.findAll();
        
        assertEquals(2, places.size());
    }
    
    @Test
    void testFindByCity() {
        PlaceEntity place2 = PlaceEntity.builder()
                .id("place-2")
                .name("Another Place")
                .city("Test City")
                .country("Different Country")
                .build();
        placeRepository.save(place2);
        
        PlaceEntity place3 = PlaceEntity.builder()
                .id("place-3")
                .name("Different City Place")
                .city("Different City")
                .country("Test Country")
                .build();
        placeRepository.save(place3);

        
        Page<PlaceEntity> testCityPlaces = placeRepository.findByCity("Test City", DEFAULT_PAGEABLE);
        
        assertEquals(2, testCityPlaces.getContent().size());
        assertTrue(testCityPlaces.getContent().stream().allMatch(p -> "Test City".equals(p.getCity())));
    }
    
    @Test
    void testFindByCountry() {
        PlaceEntity place2 = PlaceEntity.builder()
                .id("place-2")
                .name("Another Place")
                .city("Different City")
                .country("Test Country")
                .build();
        placeRepository.save(place2);
        
        PlaceEntity place3 = PlaceEntity.builder()
                .id("place-3")
                .name("Different Country Place")
                .city("City 3")
                .country("Different Country")
                .build();
        placeRepository.save(place3);

        
        Page<PlaceEntity> testCountryPlaces = placeRepository.findByCountry("Test Country", DEFAULT_PAGEABLE);
        
        assertEquals(2, testCountryPlaces.getContent().size());
        assertTrue(testCountryPlaces.getContent().stream().allMatch(p -> "Test Country".equals(p.getCountry())));
    }
    
    @Test
    void testFindByCityAndCountry() {
        PlaceEntity place2 = PlaceEntity.builder()
                .id("place-2")
                .name("Same City Different Country")
                .city("Test City")
                .country("Different Country")
                .build();
        placeRepository.save(place2);
        
        PlaceEntity place3 = PlaceEntity.builder()
                .id("place-3")
                .name("Different City Same Country")
                .city("Different City")
                .country("Test Country")
                .build();
        placeRepository.save(place3);

        
        Page<PlaceEntity> places = placeRepository.findByCityAndCountry("Test City", "Test Country", DEFAULT_PAGEABLE);
        
        assertEquals(1, places.getContent().size());
        assertEquals("place-1", places.getContent().get(0).getId());
    }
    
    @Test
    void testFindByNameIgnoreCase() {
        PlaceEntity place2 = new PlaceEntity();
        place2.setId("place-2");
        place2.setName("test place");
        place2.setCity("City 2");
        place2.setCountry("Country 2");
        placeRepository.save(place2);
        
        PlaceEntity place3 = new PlaceEntity();
        place3.setId("place-3");
        place3.setName("TEST PLACE");
        place3.setCity("City 3");
        place3.setCountry("Country 3");
        placeRepository.save(place3);

        
        Page<PlaceEntity> places = placeRepository.findByNameIgnoreCase("test place", DEFAULT_PAGEABLE);
        
        assertEquals(3, places.getContent().size());
        assertTrue(places.getContent().stream()
            .allMatch(p -> p.getName().equalsIgnoreCase("test place")));
    }
    
    @Test
    void testUpdatePlace() {
        PlaceEntity place = placeRepository.findById("place-1").orElseThrow();
        LocalDateTime originalUpdatedAt = place.getUpdatedAt();
        
        place.setName("Updated Place");
        place.setCity("Updated City");
        place.setLatitude(57.0);
        place.setLongitude(13.0);
        
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        placeRepository.save(place);

        
        PlaceEntity updatedPlace = placeRepository.findById("place-1").orElseThrow();
        
        assertEquals("Updated Place", updatedPlace.getName());
        assertEquals("Updated City", updatedPlace.getCity());
        assertEquals(57.0, updatedPlace.getLatitude());
        assertEquals(13.0, updatedPlace.getLongitude());
        assertTrue(updatedPlace.getUpdatedAt().isAfter(originalUpdatedAt) || 
                   updatedPlace.getUpdatedAt().isEqual(originalUpdatedAt));
    }
    
    @Test
    void testDeletePlace() {
        placeRepository.deleteById("place-1");

        
        Optional<PlaceEntity> deletedPlace = placeRepository.findById("place-1");
        
        assertTrue(deletedPlace.isEmpty());
    }
    
    @Test
    void testPlaceLocationFields() {
        PlaceEntity place = new PlaceEntity();
        place.setId("place-location");
        place.setName("Location Test");
        place.setStreet("456 Location St");
        place.setCity("Location City");
        place.setZip("67890");
        place.setCountry("Location Country");
        place.setLatitude(48.8566);
        place.setLongitude(2.3522);
        
        placeRepository.save(place);

        
        PlaceEntity retrieved = placeRepository.findById("place-location").orElseThrow();
        
        assertEquals("456 Location St", retrieved.getStreet());
        assertEquals("Location City", retrieved.getCity());
        assertEquals("67890", retrieved.getZip());
        assertEquals("Location Country", retrieved.getCountry());
        assertEquals(48.8566, retrieved.getLatitude());
        assertEquals(2.3522, retrieved.getLongitude());
    }
    
    @Test
    void testPlaceWithMinimalData() {
        PlaceEntity place = new PlaceEntity();
        place.setId("place-minimal");
        place.setName("Minimal Place");
        // All other fields are null
        
        placeRepository.save(place);

        
        PlaceEntity retrieved = placeRepository.findById("place-minimal").orElseThrow();
        
        assertEquals("Minimal Place", retrieved.getName());
        assertNull(retrieved.getCity());
        assertNull(retrieved.getCountry());
        assertNull(retrieved.getLatitude());
        assertNull(retrieved.getLongitude());
    }
    
    @Test
    void testFindByCityEmptyResult() {
        Page<PlaceEntity> places = placeRepository.findByCity("Non-existent City", DEFAULT_PAGEABLE);
        
        assertTrue(places.getContent().isEmpty());
    }
}

