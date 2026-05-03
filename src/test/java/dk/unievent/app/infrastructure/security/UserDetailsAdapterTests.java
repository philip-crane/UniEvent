package dk.unievent.app.infrastructure.security;

import dk.unievent.app.db.model.UserEntity;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import static org.junit.jupiter.api.Assertions.*;

class UserDetailsAdapterTests {

    private UserEntity userEntity(String email, String password, String role) {
        return UserEntity.builder()
            .email(email)
            .password(password)
            .username("testuser")
            .role(role)
            .build();
    }

    @Test
    void getUsernameShouldReturnEmail() {
        UserDetailsAdapter adapter = new UserDetailsAdapter(userEntity("alice@example.com", "secret", "user"));

        assertEquals("alice@example.com", adapter.getUsername());
    }

    @Test
    void getPasswordShouldReturnHashedPassword() {
        UserDetailsAdapter adapter = new UserDetailsAdapter(userEntity("alice@example.com", "hashed-pw", "user"));

        assertEquals("hashed-pw", adapter.getPassword());
    }

    @Test
    void getAuthoritiesShouldContainRolePrefix() {
        UserDetailsAdapter adapter = new UserDetailsAdapter(userEntity("alice@example.com", "pw", "organizer"));

        assertTrue(adapter.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_organizer")));
    }

    @Test
    void getAuthoritiesShouldContainAdminRole() {
        UserDetailsAdapter adapter = new UserDetailsAdapter(userEntity("admin@example.com", "pw", "admin"));

        assertTrue(adapter.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_admin")));
    }

    @Test
    void getUserShouldReturnWrappedEntity() {
        UserEntity entity = userEntity("bob@example.com", "pw", "user");
        UserDetailsAdapter adapter = new UserDetailsAdapter(entity);

        assertSame(entity, adapter.getUser());
    }

    @Test
    void accountShouldBeNonExpiredAndEnabled() {
        UserDetailsAdapter adapter = new UserDetailsAdapter(userEntity("x@example.com", "pw", "user"));

        assertTrue(adapter.isAccountNonExpired());
        assertTrue(adapter.isAccountNonLocked());
        assertTrue(adapter.isCredentialsNonExpired());
        assertTrue(adapter.isEnabled());
    }
}
