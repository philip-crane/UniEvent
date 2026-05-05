package dk.unievent.app.application.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UserDTOTests {

    @Test
    void allArgsConstructorAndGettersShouldWork() {
        UserDTO dto = new UserDTO("alice", "alice@example.com", "secret", "organizer");

        assertEquals("alice", dto.getUsername());
        assertEquals("alice@example.com", dto.getEmail());
        assertEquals("secret", dto.getPassword());
        assertEquals("organizer", dto.getRole());
    }

    @Test
    void noArgsConstructorAndSettersShouldWork() {
        UserDTO dto = new UserDTO();
        dto.setUsername("bob");
        dto.setEmail("bob@example.com");
        dto.setPassword("pass");
        dto.setRole("admin");

        assertEquals("bob", dto.getUsername());
        assertEquals("bob@example.com", dto.getEmail());
        assertEquals("pass", dto.getPassword());
        assertEquals("admin", dto.getRole());
    }

    @Test
    void fieldsShouldBeNullByDefault() {
        UserDTO dto = new UserDTO();

        assertNull(dto.getUsername());
        assertNull(dto.getEmail());
        assertNull(dto.getPassword());
        assertNull(dto.getRole());
    }
}
