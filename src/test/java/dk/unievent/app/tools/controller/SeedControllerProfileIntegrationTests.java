package dk.unievent.app.tools.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class SeedControllerProfileIntegrationTests {

    @Autowired
    private ApplicationContext context;

    @Test
    void seedControllerShouldNotBeLoadedOutsideDevProfile() {
        assertThrows(NoSuchBeanDefinitionException.class, () -> context.getBean(SeedController.class));
    }
}
