package dk.unievent.app.db.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    Page<EventEntity> findAllByOrderByStartTimeAsc(Pageable pageable);
    
    /**
     * Find all future events (startTime >= now) ordered by start time
     * Eagerly fetches: page, place, coverImage
     */
    @EntityGraph(attributePaths = {"page", "place", "coverImage"})
    Page<EventEntity> findByStartTimeGreaterThanEqualOrderByStartTimeAsc(LocalDateTime startTime, Pageable pageable);
    
    /**
     * Find events by page ID ordered by start time
     * Eagerly fetches: page, place, coverImage
     */
    @EntityGraph(attributePaths = {"page", "place", "coverImage"})
    Page<EventEntity> findByPageIdOrderByStartTimeAsc(String pageId, Pageable pageable);
    
    /**
     * Find events by page ID and future start time
     * Eagerly fetches: page, place, coverImage
     */
    @EntityGraph(attributePaths = {"page", "place", "coverImage"})
    Page<EventEntity> findByPageIdAndStartTimeGreaterThanEqualOrderByStartTimeAsc(String pageId, LocalDateTime startTime, Pageable pageable);
    
    /**
     * Find events by place ID ordered by start time
     * Eagerly fetches: page, place, coverImage
     */
    @EntityGraph(attributePaths = {"page", "place", "coverImage"})
    Page<EventEntity> findByPlaceIdOrderByStartTimeAsc(String placeId, Pageable pageable);

    List<EventEntity> findByPlaceId(String placeId);
}
