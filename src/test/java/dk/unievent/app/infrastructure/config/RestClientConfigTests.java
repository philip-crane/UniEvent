package dk.unievent.app.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class RestClientConfigTests {

    private final RestClientConfig config = new RestClientConfig();

    @Test
    void restClientBuilderBeanShouldNotBeNull() {
        RestClient.Builder builder = config.restClientBuilder();
        assertNotNull(builder);
    }

    @Test
    void objectMapperBeanShouldNotBeNull() {
        ObjectMapper mapper = config.objectMapper();
        assertNotNull(mapper);
    }

    @Test
    void objectMapperShouldHaveJavaTimeModuleRegistered() {
        ObjectMapper mapper = config.objectMapper();
        assertNotNull(mapper.getRegisteredModuleIds());
    }
}
