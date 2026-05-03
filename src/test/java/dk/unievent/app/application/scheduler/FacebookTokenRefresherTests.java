package dk.unievent.app.application.scheduler;

import dk.unievent.app.tools.services.TokenRefreshService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FacebookTokenRefresherTests {

    @Mock
    private TokenRefreshService tokenRefreshService;

    @InjectMocks
    private FacebookTokenRefresher tokenRefresher;

    @Test
    void refreshPageTokensShouldDelegateToTokenRefreshService() {
        tokenRefresher.refreshPageTokens();

        verify(tokenRefreshService).refreshAll();
    }

    @Test
    void refreshPageTokensShouldSwallowExceptions() {
        doThrow(new RuntimeException("Vault unavailable")).when(tokenRefreshService).refreshAll();

        assertDoesNotThrow(() -> tokenRefresher.refreshPageTokens());
    }
}
