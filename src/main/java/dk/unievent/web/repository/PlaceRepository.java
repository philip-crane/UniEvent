package dk.unievent.web.repository;

import dk.unievent.web.model.PlaceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlaceRepository extends JpaRepository<PlaceEntity, String> {
    
    /**
     * Find places by city
     */
    List<PlaceEntity> findByCity(String city);
    
    /**
     * Find places by country
     */
    List<PlaceEntity> findByCountry(String country);
    
    /**
     * Find places by city and country
     */
    List<PlaceEntity> findByCityAndCountry(String city, String country);
    
    /**
     * Find places by name (case-insensitive)
     */
    List<PlaceEntity> findByNameIgnoreCase(String name);
}
