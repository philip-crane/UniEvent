package dk.unievent.app.application.service;

import dk.unievent.app.db.model.EventEntity;
import dk.unievent.app.db.model.UserEntity;
import dk.unievent.app.db.model.UserEventLikeEntity;
import dk.unievent.app.db.repository.EventRepository;
import dk.unievent.app.db.repository.UserEventLikeRepository;
import dk.unievent.app.db.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserLikeServiceTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private UserEventLikeRepository userEventLikeRepository;

    @InjectMocks
    private UserLikeService userLikeService;

    private UserEntity user;
    private EventEntity event;

    @BeforeEach
    void setUp() {
        user = UserEntity.builder()
                .id(42L)
                .username("likes")
                .email("likes@example.com")
                .password("encoded")
                .build();
        event = EventEntity.builder()
                .id("event-1")
                .title("Event 1")
                .build();
        lenient().when(userRepository.findByEmail("likes@example.com")).thenReturn(Optional.of(user));
    }

    @Test
    void getLikedEventIdsShouldReturnEmptyForNewUser() {
        when(userEventLikeRepository.findEventIdsByUserId(42L)).thenReturn(List.of());

        assertEquals(List.of(), userLikeService.getLikedEventIds("likes@example.com"));
    }

    @Test
    void likeEventShouldSaveWhenNotAlreadyLiked() {
        when(eventRepository.findById("event-1")).thenReturn(Optional.of(event));
        when(userEventLikeRepository.existsByUserIdAndEventId(42L, "event-1")).thenReturn(false);
        when(userEventLikeRepository.findEventIdsByUserId(42L)).thenReturn(List.of("event-1"));

        List<String> result = userLikeService.likeEvent("likes@example.com", "event-1");

        assertEquals(List.of("event-1"), result);
        ArgumentCaptor<UserEventLikeEntity> captor = ArgumentCaptor.forClass(UserEventLikeEntity.class);
        verify(userEventLikeRepository).save(captor.capture());
        assertEquals(42L, captor.getValue().getUser().getId());
        assertEquals("event-1", captor.getValue().getEvent().getId());
    }

    @Test
    void likeEventShouldBeIdempotentWhenAlreadyLiked() {
        when(eventRepository.findById("event-1")).thenReturn(Optional.of(event));
        when(userEventLikeRepository.existsByUserIdAndEventId(42L, "event-1")).thenReturn(true);
        when(userEventLikeRepository.findEventIdsByUserId(42L)).thenReturn(List.of("event-1"));

        assertEquals(List.of("event-1"), userLikeService.likeEvent("likes@example.com", "event-1"));
        verify(userEventLikeRepository, never()).save(any());
    }

    @Test
    void likeEventShouldRejectMissingEvent() {
        when(eventRepository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> userLikeService.likeEvent("likes@example.com", "missing"));
        verify(userEventLikeRepository, never()).save(any());
    }

    @Test
    void unlikeEventShouldDeleteIdempotently() {
        when(userEventLikeRepository.findEventIdsByUserId(42L)).thenReturn(List.of());

        assertEquals(List.of(), userLikeService.unlikeEvent("likes@example.com", "event-1"));
        verify(userEventLikeRepository).deleteByUserIdAndEventId(42L, "event-1");
    }

    @Test
    void mergeLikedEventIdsShouldImportOnlyExistingEvents() {
        when(eventRepository.findAllById(any())).thenReturn(List.of(event));
        when(userEventLikeRepository.existsByUserIdAndEventId(42L, "event-1")).thenReturn(false);
        when(userEventLikeRepository.findEventIdsByUserId(42L)).thenReturn(List.of("event-1"));

        List<String> result = userLikeService.mergeLikedEventIds("likes@example.com", Arrays.asList("event-1", "missing", null, "", "event-1"));

        assertEquals(List.of("event-1"), result);
        verify(userEventLikeRepository, times(1)).save(any(UserEventLikeEntity.class));
    }
}
