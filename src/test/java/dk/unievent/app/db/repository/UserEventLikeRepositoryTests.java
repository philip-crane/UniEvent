package dk.unievent.app.db.repository;

import dk.unievent.app.db.model.EventEntity;
import dk.unievent.app.db.model.PageEntity;
import dk.unievent.app.db.model.UserEntity;
import dk.unievent.app.db.model.UserEventLikeEntity;
import dk.unievent.app.db.model.UserEventLikeId;
import jakarta.persistence.EntityManager;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserEventLikeRepositoryTests {

    @Autowired
    private UserEventLikeRepository userEventLikeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private PageRepository pageRepository;

    @Autowired
    private EntityManager entityManager;

    private UserEntity user;
    private EventEntity event;

    @BeforeEach
    void setUp() {
        user = userRepository.save(UserEntity.builder()
                .username("likes-user")
                .email("likes@example.com")
                .password("encoded")
                .build());

        PageEntity page = pageRepository.save(PageEntity.builder()
                .id("likes-page")
                .name("Likes Page")
                .build());

        event = eventRepository.save(EventEntity.builder()
                .id("likes-event")
                .title("Likes Event")
                .page(page)
                .startTime(LocalDateTime.now().plusDays(1))
                .build());
    }

    @Test
    void saveShouldPersistUniqueUserEventLike() {
        saveLike(user, event);

        assertTrue(userEventLikeRepository.existsByUserIdAndEventId(user.getId(), event.getId()));
        assertEquals(1, userEventLikeRepository.findEventIdsByUserId(user.getId()).size());
    }

    @Test
    void saveShouldRejectDuplicateUserEventLike() {
        saveLike(user, event);
        userEventLikeRepository.flush();
        entityManager.clear();

        assertThrows(ConstraintViolationException.class, () -> {
            entityManager.persist(UserEventLikeEntity.builder()
                    .id(new UserEventLikeId(user.getId(), event.getId()))
                    .user(entityManager.getReference(UserEntity.class, user.getId()))
                    .event(entityManager.getReference(EventEntity.class, event.getId()))
                    .build());
            entityManager.flush();
        });
    }

    @Test
    void deletingUserShouldCascadeLikes() {
        saveLike(user, event);
        userEventLikeRepository.flush();
        entityManager.clear();

        userRepository.deleteById(user.getId());
        userRepository.flush();
        entityManager.clear();

        assertFalse(userEventLikeRepository.existsById(new UserEventLikeId(user.getId(), event.getId())));
    }

    @Test
    void deletingEventShouldCascadeLikes() {
        saveLike(user, event);
        userEventLikeRepository.flush();
        entityManager.clear();

        eventRepository.deleteById(event.getId());
        eventRepository.flush();
        entityManager.clear();

        assertFalse(userEventLikeRepository.existsById(new UserEventLikeId(user.getId(), event.getId())));
    }

    private void saveLike(UserEntity likeUser, EventEntity likeEvent) {
        userEventLikeRepository.save(UserEventLikeEntity.builder()
                .id(new UserEventLikeId(likeUser.getId(), likeEvent.getId()))
                .user(likeUser)
                .event(likeEvent)
                .build());
    }
}
