package dk.unievent.app;

import dk.unievent.app.application.service.VaultService;
import org.mockito.Mockito;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class VaultServiceTestConfig {

    @Bean
    @ConditionalOnMissingBean
    VaultService vaultService() {
        return Mockito.mock(VaultService.class);
    }
}
