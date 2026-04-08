package dk.unievent.app.infrastructure.client;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.ObjectMapper;

import dk.unievent.app.infrastructure.config.VaultConfig;

@ExtendWith(MockitoExtension.class)
class VaultClientTests {

    private MockRestServiceServer server;

    private VaultClient vaultClient;

    @BeforeEach
    void setUp() {
        RestClient.Builder restClientBuilder = RestClient.builder();
        server = MockRestServiceServer.bindTo(restClientBuilder).build();

        VaultConfig config = new VaultConfig();
        config.setUri("http://localhost:8200");
        config.setSecretPath("secret/data/unievent");
        config.setToken("dev-token");
        vaultClient = new VaultClient(config, restClientBuilder, new ObjectMapper());
    }

    @Test
    void readSecretDataShouldThrowWhenVaultStatusNotOk() {
        server.expect(requestTo("http://localhost:8200/v1/secret/data/unievent"))
            .andRespond(withStatus(HttpStatus.FORBIDDEN).body("forbidden"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> vaultClient.readSecretData());
        assertTrue(ex.getMessage().contains("Failed to read secrets from Vault"));
        assertTrue(ex.getMessage().contains("status"));
    }

    @Test
    void readSecretDataShouldReturnParsedValuesWhenResponseValid() {
        server.expect(requestTo("http://localhost:8200/v1/secret/data/unievent"))
            .andRespond(withSuccess("{\"data\":{\"data\":{\"DB_USER\":\"unievent\",\"DB_PASS\":\"secret\"}}}", MediaType.APPLICATION_JSON));

        Map<String, String> result = vaultClient.readSecretData();

        assertEquals("unievent", result.get("DB_USER"));
        assertEquals("secret", result.get("DB_PASS"));
        assertEquals(2, result.size());
    }

    @Test
    void readSecretValueShouldReturnNullWhenKeyNotPresent() {
        server.expect(requestTo("http://localhost:8200/v1/secret/data/unievent"))
            .andRespond(withSuccess("{\"data\":{\"data\":{\"OTHER\":\"value\"}}}", MediaType.APPLICATION_JSON));

        String result = vaultClient.readSecretValue("MISSING");

        assertEquals(null, result);
    }

    @Test
    void readSecretDataShouldWrapUnexpectedFailures() {
        server.expect(requestTo("http://localhost:8200/v1/secret/data/unievent"))
            .andRespond(withSuccess("{bad-json", MediaType.APPLICATION_JSON));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> vaultClient.readSecretData());
        assertTrue(ex.getMessage().contains("Failed to read secrets from Vault"));
    }
}
