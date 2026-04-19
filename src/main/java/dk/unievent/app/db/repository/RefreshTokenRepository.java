package dk.unievent.app.db.repository;

import dk.unievent.app.db.model.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {

    Optional<RefreshTokenEntity> findByTokenId(String tokenId);

    List<RefreshTokenEntity> findAllByFamilyIdAndRevokedAtIsNull(String familyId);

    List<RefreshTokenEntity> findAllByUserEmailAndRevokedAtIsNull(String userEmail);

    List<RefreshTokenEntity> findAllByExpiresAtBefore(Instant now);

    @Modifying
    @Query("UPDATE RefreshTokenEntity t SET t.revokedAt = :revokedAt WHERE t.familyId = :familyId AND t.revokedAt IS NULL")
    int revokeByFamilyId(@Param("familyId") String familyId, @Param("revokedAt") Instant revokedAt);
}