package dk.unievent.app.infrastructure.seeding;

import dk.unievent.app.db.model.EventEntity;
import dk.unievent.app.db.model.PageEntity;
import dk.unievent.app.db.model.PlaceEntity;
import dk.unievent.app.db.repository.EventRepository;
import dk.unievent.app.db.repository.PageRepository;
import dk.unievent.app.db.repository.PlaceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Service for seeding and clearing test data locally.
 * All seeded records are marked with "SEED_" prefix for easy identification and removal.
 */
@Slf4j
@Service
public class DataSeederService {

    private final EventRepository eventRepository;
    private final PageRepository pageRepository;
    private final PlaceRepository placeRepository;

    private static final String SEED_PREFIX = "SEED_";

    public DataSeederService(EventRepository eventRepository, PageRepository pageRepository, PlaceRepository placeRepository) {
        this.eventRepository = eventRepository;
        this.pageRepository = pageRepository;
        this.placeRepository = placeRepository;
    }

    /**
     * Seeds minimal test data to the database.
     * Creates 2 pages, 10 events, and 2 places with relationships.
     */
    @Transactional
    public SeedResult seedData() {
        log.info("Starting data seed operation...");
        try {
            // Create places
            PlaceEntity copenhagenPlace = createAndSavePlace("SEED_CPH", "Copenhagen", "Nørrebro", "1200", "Denmark", 55.6761, 12.5683);
            PlaceEntity aarhusPlace = createAndSavePlace("SEED_AAH", "Aarhus", "Centrum", "8000", "Denmark", 56.1629, 10.2039);

            // Create pages
            PageEntity techEventsPage = createAndSavePage("SEED_TECH_EVENTS", "Tech Events");
            PageEntity cultureEventsPage = createAndSavePage("SEED_CULTURE_EVENTS", "Culture Events");

            // Create events for Tech Events page
            LocalDateTime now = LocalDateTime.now();
            createAndSaveEvent("SEED_EVENT_001", "React Workshop", "Deep dive into modern React patterns", 
                now.plus(7, ChronoUnit.DAYS).withHour(10).withMinute(0), 
                now.plus(7, ChronoUnit.DAYS).withHour(12).withMinute(0), 
                techEventsPage, copenhagenPlace);

            createAndSaveEvent("SEED_EVENT_002", "Spring Boot Masterclass", "Advanced Spring Boot techniques", 
                now.plus(14, ChronoUnit.DAYS).withHour(9).withMinute(30), 
                now.plus(14, ChronoUnit.DAYS).withHour(17).withMinute(30), 
                techEventsPage, copenhagenPlace);

            createAndSaveEvent("SEED_EVENT_003", "Docker & Kubernetes 101", "Container orchestration fundamentals", 
                now.plus(21, ChronoUnit.DAYS).withHour(14).withMinute(0), 
                now.plus(21, ChronoUnit.DAYS).withHour(16).withMinute(0), 
                techEventsPage, aarhusPlace);

            createAndSaveEvent("SEED_EVENT_004", "AI & Machine Learning", "Introduction to ML in production", 
                now.plus(30, ChronoUnit.DAYS).withHour(10).withMinute(0), 
                now.plus(30, ChronoUnit.DAYS).withHour(16).withMinute(0), 
                techEventsPage, copenhagenPlace);

            createAndSaveEvent("SEED_EVENT_005", "GraphQL Best Practices", "Building scalable GraphQL systems", 
                now.plus(45, ChronoUnit.DAYS).withHour(13).withMinute(0), 
                now.plus(45, ChronoUnit.DAYS).withHour(15).withMinute(0), 
                techEventsPage, null);

            // Create events for Culture Events page
            createAndSaveEvent("SEED_EVENT_006", "Jazz Night", "Live jazz performance with local musicians", 
                now.plus(5, ChronoUnit.DAYS).withHour(20).withMinute(0), 
                now.plus(5, ChronoUnit.DAYS).withHour(23).withMinute(0), 
                cultureEventsPage, copenhagenPlace);

            createAndSaveEvent("SEED_EVENT_007", "Art Exhibition Opening", "Contemporary art exhibition preview", 
                now.plus(10, ChronoUnit.DAYS).withHour(18).withMinute(0), 
                now.plus(10, ChronoUnit.DAYS).withHour(21).withMinute(0), 
                cultureEventsPage, aarhusPlace);

            createAndSaveEvent("SEED_EVENT_008", "Film Festival", "Screening of indie films from around the world", 
                now.plus(20, ChronoUnit.DAYS).withHour(19).withMinute(0), 
                now.plus(20, ChronoUnit.DAYS).withHour(22).withMinute(0), 
                cultureEventsPage, copenhagenPlace);

            createAndSaveEvent("SEED_EVENT_009", "Classical Music Concert", "Danish Philharmonic Orchestra performance", 
                now.plus(25, ChronoUnit.DAYS).withHour(19).withMinute(30), 
                now.plus(25, ChronoUnit.DAYS).withHour(21).withMinute(30), 
                cultureEventsPage, copenhagenPlace);

            createAndSaveEvent("SEED_EVENT_010", "Book Club Meeting", "Discussion of contemporary Nordic literature", 
                now.plus(35, ChronoUnit.DAYS).withHour(17).withMinute(0), 
                now.plus(35, ChronoUnit.DAYS).withHour(19).withMinute(0), 
                cultureEventsPage, null);

            SeedResult result = new SeedResult(true, "Seed data created successfully", 2, 10, 2);
            log.info("Data seed completed: {} pages, {} events, {} places", result.getPageCount(), result.getEventCount(), result.getPlaceCount());
            return result;
        } catch (Exception e) {
            log.error("Error during data seed operation", e);
            return new SeedResult(false, "Error during seed operation: " + e.getMessage(), 0, 0, 0);
        }
    }

    /**
     * Clears all seeded test data from the database.
     * Deletes only records marked with SEED_ prefix.
     */
    @Transactional
    public SeedResult clearSeedData() {
        log.info("Starting data cleanup operation...");
        try {
            // Count records before deletion
            long initialEventCount = eventRepository.count();
            long initialPageCount = pageRepository.count();
            long initialPlaceCount = placeRepository.count();

            // Delete events with SEED_ prefix
            List<EventEntity> seededEvents = eventRepository.findAll().stream()
                .filter(e -> e.getId().startsWith(SEED_PREFIX))
                .toList();
            eventRepository.deleteAll(seededEvents);
            long deletedEvents = seededEvents.size();

            // Delete pages with SEED_ prefix (events must be deleted first due to foreign key)
            List<PageEntity> seededPages = pageRepository.findAll().stream()
                .filter(p -> p.getId().startsWith(SEED_PREFIX))
                .toList();
            pageRepository.deleteAll(seededPages);
            long deletedPages = seededPages.size();

            // Delete places with SEED_ prefix (events must be deleted first due to foreign key)
            List<PlaceEntity> seededPlaces = placeRepository.findAll().stream()
                .filter(p -> p.getId().startsWith(SEED_PREFIX))
                .toList();
            placeRepository.deleteAll(seededPlaces);
            long deletedPlaces = seededPlaces.size();

            SeedResult result = new SeedResult(true, "Seed data cleared successfully", 
                deletedPages, deletedEvents, deletedPlaces);
            log.info("Data cleanup completed: deleted {} pages, {} events, {} places", 
                deletedPages, deletedEvents, deletedPlaces);
            return result;
        } catch (Exception e) {
            log.error("Error during data cleanup operation", e);
            return new SeedResult(false, "Error during cleanup operation: " + e.getMessage(), 0, 0, 0);
        }
    }

    private PlaceEntity createAndSavePlace(String id, String name, String street, String zip, String country, Double latitude, Double longitude) {
        PlaceEntity place = PlaceEntity.builder()
            .id(id)
            .name(name)
            .street(street)
            .zip(zip)
            .country(country)
            .latitude(latitude)
            .longitude(longitude)
            .build();
        return placeRepository.save(place);
    }

    private PageEntity createAndSavePage(String id, String name) {
        PageEntity page = PageEntity.builder()
            .id(id)
            .name(name)
            .tokenStatus("valid")
            .build();
        return pageRepository.save(page);
    }

    private EventEntity createAndSaveEvent(String id, String title, String description, 
                                          LocalDateTime startTime, LocalDateTime endTime,
                                          PageEntity page, PlaceEntity place) {
        EventEntity event = EventEntity.builder()
            .id(id)
            .title(title)
            .description(description)
            .startTime(startTime)
            .endTime(endTime)
            .page(page)
            .place(place)
            .build();
        return eventRepository.save(event);
    }
}
