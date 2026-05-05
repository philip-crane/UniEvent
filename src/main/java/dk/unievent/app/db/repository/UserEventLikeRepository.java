package dk.unievent.app.db.repository;

import dk.unievent.app.db.model.UserEventLikeEntity;
import dk.unievent.app.db.model.UserEventLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserEventLikeRepository extends JpaRepository<UserEventLikeEntity, UserEventLikeId> {

    @Query("SELECT COUNT(userLike) > 0 FROM UserEventLikeEntity userLike WHERE userLike.user.id = :userId AND userLike.event.id = :eventId")
    boolean existsByUserIdAndEventId(@Param("userId") Long userId, @Param("eventId") String eventId);

    @Query("SELECT userLike.event.id FROM UserEventLikeEntity userLike WHERE userLike.user.id = :userId ORDER BY userLike.event.id ASC")
    List<String> findEventIdsByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM UserEventLikeEntity userLike WHERE userLike.user.id = :userId AND userLike.event.id = :eventId")
    int deleteByUserIdAndEventId(@Param("userId") Long userId, @Param("eventId") String eventId);
}
