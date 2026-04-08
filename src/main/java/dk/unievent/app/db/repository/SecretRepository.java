package dk.unievent.app.db.repository;

import dk.unievent.app.db.model.SecretEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SecretRepository extends JpaRepository<SecretEntity, Long> {

    Optional<SecretEntity> findByName(String name);

    /**
     * Find secrets by type ordered by name
     */
    Page<SecretEntity> findBySecretTypeOrderByNameAsc(String secretType, Pageable pageable);

    /**
     * Find secrets by status ordered by name
     */
    Page<SecretEntity> findByStatusOrderByNameAsc(String status, Pageable pageable);
}
