package dk.unievent.app.db.repository;

import dk.unievent.app.db.model.SecretEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SecretRepositoryTests {

    private static final Pageable DEFAULT_PAGEABLE = PageRequest.of(0, 20);

    @Autowired
    private SecretRepository secretRepository;

    @BeforeEach
    void setUp() {
        SecretEntity first = SecretEntity.builder()
            .name("database-password")
            .secretType("database")
            .vaultPath("secret/data/db")
            .vaultKey("password")
            .status("active")
            .build();

        SecretEntity second = SecretEntity.builder()
            .name("api-token")
            .secretType("api")
            .vaultPath("secret/data/api")
            .vaultKey("token")
            .status("active")
            .build();

        SecretEntity third = SecretEntity.builder()
            .name("legacy-key")
            .secretType("api")
            .vaultPath("secret/data/legacy")
            .vaultKey("key")
            .status("inactive")
            .build();

        secretRepository.save(first);
        secretRepository.save(second);
        secretRepository.save(third);
    }

    @Test
    void testFindByName() {
        Optional<SecretEntity> found = secretRepository.findByName("api-token");

        assertTrue(found.isPresent());
        assertEquals("api", found.get().getSecretType());
        assertEquals("secret/data/api", found.get().getVaultPath());
    }

    @Test
    void testFindByNameNotFound() {
        Optional<SecretEntity> found = secretRepository.findByName("missing-name");

        assertTrue(found.isEmpty());
    }

    @Test
    void testFindBySecretTypeOrderByNameAsc() {
        Page<SecretEntity> apiSecrets = secretRepository.findBySecretTypeOrderByNameAsc("api", DEFAULT_PAGEABLE);

        assertEquals(2, apiSecrets.getContent().size());
        assertEquals("api-token", apiSecrets.getContent().get(0).getName());
        assertEquals("legacy-key", apiSecrets.getContent().get(1).getName());
    }

    @Test
    void testFindByStatusOrderByNameAsc() {
        Page<SecretEntity> activeSecrets = secretRepository.findByStatusOrderByNameAsc("active", DEFAULT_PAGEABLE);

        assertEquals(2, activeSecrets.getContent().size());
        assertEquals("api-token", activeSecrets.getContent().get(0).getName());
        assertEquals("database-password", activeSecrets.getContent().get(1).getName());
    }

    @Test
    void testFindByStatusOrderByNameAscNoResults() {
        Page<SecretEntity> rotatedSecrets = secretRepository.findByStatusOrderByNameAsc("rotated", DEFAULT_PAGEABLE);

        assertTrue(rotatedSecrets.getContent().isEmpty());
    }
}
