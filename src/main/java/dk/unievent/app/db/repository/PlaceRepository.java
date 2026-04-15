package dk.unievent.app.db.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import dk.unievent.app.db.model.PlaceEntity;

@Repository
public interface PlaceRepository extends JpaRepository<PlaceEntity, String> {
    
    /**
     * Find places by city
     */
    Page<PlaceEntity> findByCity(String city, Pageable pageable);
    
    /**
     * Find places by country
     */
    Page<PlaceEntity> findByCountry(String country, Pageable pageable);
    
    /**
     * Find places by city and country
     */
    Page<PlaceEntity> findByCityAndCountry(String city, String country, Pageable pageable);
    
    /**
     * Find places by name using partial match (contains, case-insensitive)
     */
    @Query("SELECT p FROM PlaceEntity p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', ?1, '%')) ORDER BY p.name ASC")
    Page<PlaceEntity> findByNameIgnoreCase(String name, Pageable pageable);
}
