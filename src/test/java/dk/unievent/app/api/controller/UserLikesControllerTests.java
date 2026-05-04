package dk.unievent.app.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dk.unievent.app.api.handler.GlobalExceptionHandler;
import dk.unievent.app.application.service.UserLikeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.NoSuchElementException;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserLikesControllerTests {

    private static final UsernamePasswordAuthenticationToken AUTH =
            new UsernamePasswordAuthenticationToken("likes@example.com", null);

    @Mock
    private UserLikeService userLikeService;

    @InjectMocks
    private UserLikesController userLikesController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(userLikesController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void getLikesShouldReturnCurrentUserEventIds() throws Exception {
        when(userLikeService.getLikedEventIds("likes@example.com")).thenReturn(List.of("event-1"));

        mockMvc.perform(get("/api/users/me/likes").principal(AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eventIds[0]").value("event-1"));
    }

    @Test
    void mergeLikesShouldPassRequestEventIds() throws Exception {
        when(userLikeService.mergeLikedEventIds("likes@example.com", List.of("event-1", "event-2")))
                .thenReturn(List.of("event-1", "event-2"));

        mockMvc.perform(post("/api/users/me/likes")
                        .principal(AUTH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new Payload(List.of("event-1", "event-2")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eventIds.length()").value(2));
    }

    @Test
    void likeEventShouldReturnNotFoundWhenEventDoesNotExist() throws Exception {
        when(userLikeService.likeEvent("likes@example.com", "missing"))
                .thenThrow(new NoSuchElementException("Event not found: missing"));

        mockMvc.perform(put("/api/users/me/likes/missing").principal(AUTH))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Event not found: missing"));
    }

    @Test
    void unlikeEventShouldDeleteForCurrentUser() throws Exception {
        when(userLikeService.unlikeEvent("likes@example.com", "event-1")).thenReturn(List.of());

        mockMvc.perform(delete("/api/users/me/likes/event-1").principal(AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eventIds.length()").value(0));

        verify(userLikeService).unlikeEvent("likes@example.com", "event-1");
    }

    private record Payload(List<String> eventIds) {
    }
}
