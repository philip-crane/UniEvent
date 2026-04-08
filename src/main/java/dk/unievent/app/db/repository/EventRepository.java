package dk.unievent.app.db.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dk.unievent.app.db.model.EventEntity;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<EventEntity, String> {
    
    /**
     * Find all events ordered by start time (ascending)
     * Eagerly fetches: page, place, coverImage
     */
    @EntityGraph(attributePaths = {"page", "place", "coverImage"})
    List<EventEntity> findAllByOrderByStartTimeAsc();
    
    /**
     * Find all future events (startTime >= now) ordered by start time
     * Eagerly fetches: page, place, coverImage
     */
    @EntityGraph(attributePaths = {"page", "place", "coverImage"})
    List<EventEntity> findByStartTimeGreaterThanEqualOrderByStartTimeAsc(LocalDateTime startTime);
    
    /**
     * Find events by page ID
     * Eagerly fetches: page, place, coverImage
     */
    @EntityGraph(attributePaths = {"page", "place", "coverImage"})
    List<EventEntity> findByPageIdOrderByStartTimeAsc(String pageId);
    
    /**
     * Find events by page ID and future start time
     * Eagerly fetches: page, place, coverImage
     */
    @EntityGraph(attributePaths = {"page", "place", "coverImage"})
    List<EventEntity> findByPageIdAndStartTimeGreaterThanEqualOrderByStartTimeAsc(String pageId, LocalDateTime startTime);
    
    /**
     * Find events by place ID
     * Eagerly fetches: page, place, coverImage
     */
    @EntityGraph(attributePaths = {"page", "place", "coverImage"})
    List<EventEntity> findByPlaceIdOrderByStartTimeAsc(String placeId);
}
