package dk.unievent.app.db.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import dk.unievent.app.db.model.PageEntity;

import java.time.LocalDateTime;

@Repository
public interface PageRepository extends JpaRepository<PageEntity, String> {
    
    /**
     * Find all pages ordered by name
     * Eagerly fetches: picture
     */
    @EntityGraph(attributePaths = {"picture"})
    Page<PageEntity> findAllByOrderByNameAsc(Pageable pageable);
    
    /**
     * Find all active pages (tokenStatus = "valid") ordered by name
     * Eagerly fetches: picture
     */
    @EntityGraph(attributePaths = {"picture"})
    Page<PageEntity> findByTokenStatusOrderByNameAsc(String tokenStatus, Pageable pageable);
    
    /**
     * Find pages with expired tokens (tokenExpiresAt < now)
     * Eagerly fetches: picture
     */
    @EntityGraph(attributePaths = {"picture"})
    Page<PageEntity> findByTokenExpiresAtLessThanOrderByTokenExpiresAtAsc(LocalDateTime expiresAt, Pageable pageable);
    
    /**
     * Find pages that need token refresh (tokenExpiresAt < now AND tokenStatus = "valid")
     * Eagerly fetches: picture
     */
    @EntityGraph(attributePaths = {"picture"})
    @Query("SELECT p FROM PageEntity p WHERE p.tokenExpiresAt < ?1 AND p.tokenStatus = 'valid' ORDER BY p.tokenExpiresAt ASC")
    Page<PageEntity> findPagesToRefresh(LocalDateTime expiresAt, Pageable pageable);
    
    /**
     * Find pages by name ordered by name (case-insensitive)
     * Eagerly fetches: picture
     */
    @EntityGraph(attributePaths = {"picture"})
    Page<PageEntity> findByNameIgnoreCase(String name, Pageable pageable);
}
