package dk.unievent.app.tools.services;

import dk.unievent.app.api.dto.FbLongLivedTokenResponse;
import dk.unievent.app.application.service.FacebookGraphApiService;
import dk.unievent.app.application.service.PageService;
import dk.unievent.app.application.service.TokenRefreshService;
import dk.unievent.app.application.service.VaultService;
import dk.unievent.app.db.model.PageEntity;
import dk.unievent.app.infrastructure.exception.FacebookApiException;
import dk.unievent.app.tools.models.RefreshResult;
import dk.unievent.app.tools.models.RefreshSummary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenServiceTests {

    @Mock
    private PageService pageService;

    @Mock
    private FacebookGraphApiService facebookGraphApiService;

    @Mock
    private VaultService vaultService;

    private TokenRefreshService tokenRefreshService;

    @BeforeEach
    void setUp() {
        tokenRefreshService = new TokenRefreshService(pageService, facebookGraphApiService, Optional.of(vaultService));
    }

    @Test
    void refreshOneShouldReturnFailureWhenNoTokenInVault() {
        when(vaultService.getPageToken("page-1")).thenReturn(Optional.empty());

        RefreshResult result = tokenRefreshService.refreshOne("page-1");

        assertFalse(result.isSuccess());
        assertEquals("No token found in Vault", result.getMessage());
        verify(pageService).logRefreshFailure("page-1", "No token found in Vault");
    }

    @Test
    void refreshOneShouldReturnFailureWhenVaultIsDisabled() {
        TokenRefreshService disabledVaultService =
            new TokenRefreshService(pageService, facebookGraphApiService, Optional.empty());

        RefreshResult result = disabledVaultService.refreshOne("page-1");

        assertFalse(result.isSuccess());
        assertEquals("Vault is disabled - token refresh unavailable", result.getMessage());
        verifyNoInteractions(vaultService);
        verifyNoInteractions(facebookGraphApiService);
    }

    @Test
    void refreshOneShouldReturnSuccessWhenTokenRefreshed() {
        FbLongLivedTokenResponse response = new FbLongLivedTokenResponse();
        response.setAccessToken("new-token");

        when(vaultService.getPageToken("page-1")).thenReturn(Optional.of("old-token"));
        when(facebookGraphApiService.refreshPageToken("old-token")).thenReturn(response);

        RefreshResult result = tokenRefreshService.refreshOne("page-1");

        assertTrue(result.isSuccess());
        assertEquals("Token refreshed", result.getMessage());
        verify(vaultService).updatePageToken("page-1", "new-token");
        verify(pageService).updateTokenMetadata("page-1");
    }

    @Test
    void refreshOneShouldReturnFailureOnFacebookApiException() {
        when(vaultService.getPageToken("page-1")).thenReturn(Optional.of("old-token"));
        when(facebookGraphApiService.refreshPageToken("old-token"))
            .thenThrow(new FacebookApiException("Token invalid", 401, "OAuthException"));

        RefreshResult result = tokenRefreshService.refreshOne("page-1");

        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("OAuthException"));
        verify(pageService).logRefreshFailure(eq("page-1"), anyString());
        verify(vaultService).markPageTokenError("page-1");
    }

    @Test
    void refreshOneShouldReturnFailureOnUnexpectedException() {
        when(vaultService.getPageToken("page-1")).thenThrow(new RuntimeException("Vault down"));

        RefreshResult result = tokenRefreshService.refreshOne("page-1");

        assertFalse(result.isSuccess());
        assertEquals("Vault down", result.getMessage());
        verify(pageService).logRefreshFailure("page-1", "Vault down");
        verify(vaultService).markPageTokenError("page-1");
    }

    @Test
    void refreshAllForceShouldIterateAllPagesAndReturnSummary() {
        PageEntity page1 = PageEntity.builder().id("p1").name("Alpha").build();
        PageEntity page2 = PageEntity.builder().id("p2").name("Beta").build();

        FbLongLivedTokenResponse response = new FbLongLivedTokenResponse();
        response.setAccessToken("new-token");

        when(pageService.getAllPageEntities(any()))
            .thenReturn(new PageImpl<>(List.of(page1, page2), PageRequest.of(0, 50), 2));
        when(vaultService.getPageToken(any())).thenReturn(Optional.of("current-token"));
        when(facebookGraphApiService.refreshPageToken("current-token")).thenReturn(response);

        RefreshSummary summary = tokenRefreshService.refreshAllForce();

        assertEquals(2, summary.getRefreshedCount());
        assertEquals(0, summary.getFailedCount());
    }

    @Test
    void refreshAllShouldOnlyRefreshPagesToRefresh() {
        PageEntity page = PageEntity.builder().id("p1").name("Expiring").build();

        FbLongLivedTokenResponse response = new FbLongLivedTokenResponse();
        response.setAccessToken("new-token");

        when(pageService.getPagesToRefresh(any()))
            .thenReturn(new PageImpl<>(List.of(page), PageRequest.of(0, 50), 1));
        when(vaultService.getPageToken("p1")).thenReturn(Optional.of("old-token"));
        when(facebookGraphApiService.refreshPageToken("old-token")).thenReturn(response);

        RefreshSummary summary = tokenRefreshService.refreshAll();

        assertEquals(1, summary.getRefreshedCount());
        assertEquals(0, summary.getFailedCount());
    }

    @Test
    void refreshAllShouldPageThroughAllPagesToRefresh() {
        PageEntity firstPage = PageEntity.builder().id("p1").name("Expiring One").build();
        PageEntity secondPage = PageEntity.builder().id("p2").name("Expiring Two").build();

        FbLongLivedTokenResponse response = new FbLongLivedTokenResponse();
        response.setAccessToken("new-token");

        when(pageService.getPagesToRefresh(PageRequest.of(0, 50)))
            .thenReturn(new PageImpl<>(List.of(firstPage), PageRequest.of(0, 50), 51));
        when(pageService.getPagesToRefresh(PageRequest.of(1, 50)))
            .thenReturn(new PageImpl<>(List.of(secondPage), PageRequest.of(1, 50), 51));
        when(vaultService.getPageToken(any())).thenReturn(Optional.of("old-token"));
        when(facebookGraphApiService.refreshPageToken("old-token")).thenReturn(response);

        RefreshSummary summary = tokenRefreshService.refreshAll();

        assertEquals(2, summary.getRefreshedCount());
        assertEquals(0, summary.getFailedCount());
        verify(pageService).getPagesToRefresh(PageRequest.of(0, 50));
        verify(pageService).getPagesToRefresh(PageRequest.of(1, 50));
        verify(pageService, never()).getPagesToRefresh(PageRequest.of(2, 50));
    }

    @Test
    void refreshAllForceShouldPageThroughAllPages() {
        PageEntity firstPage = PageEntity.builder().id("p1").name("Alpha").build();
        PageEntity secondPage = PageEntity.builder().id("p2").name("Beta").build();

        FbLongLivedTokenResponse response = new FbLongLivedTokenResponse();
        response.setAccessToken("new-token");

        when(pageService.getAllPageEntities(PageRequest.of(0, 50)))
            .thenReturn(new PageImpl<>(List.of(firstPage), PageRequest.of(0, 50), 51));
        when(pageService.getAllPageEntities(PageRequest.of(1, 50)))
            .thenReturn(new PageImpl<>(List.of(secondPage), PageRequest.of(1, 50), 51));
        when(vaultService.getPageToken(any())).thenReturn(Optional.of("old-token"));
        when(facebookGraphApiService.refreshPageToken("old-token")).thenReturn(response);

        RefreshSummary summary = tokenRefreshService.refreshAllForce();

        assertEquals(2, summary.getRefreshedCount());
        assertEquals(0, summary.getFailedCount());
        verify(pageService).getAllPageEntities(PageRequest.of(0, 50));
        verify(pageService).getAllPageEntities(PageRequest.of(1, 50));
        verify(pageService, never()).getAllPageEntities(PageRequest.of(2, 50));
    }

    @Test
    void refreshAllShouldContinueWhenOnePageFails() {
        PageEntity failingPage = PageEntity.builder().id("p1").name("No Token").build();
        PageEntity successfulPage = PageEntity.builder().id("p2").name("Fresh Token").build();

        FbLongLivedTokenResponse response = new FbLongLivedTokenResponse();
        response.setAccessToken("new-token");

        when(pageService.getPagesToRefresh(any()))
            .thenReturn(new PageImpl<>(List.of(failingPage, successfulPage), PageRequest.of(0, 50), 2));
        when(vaultService.getPageToken("p1")).thenReturn(Optional.empty());
        when(vaultService.getPageToken("p2")).thenReturn(Optional.of("old-token"));
        when(facebookGraphApiService.refreshPageToken("old-token")).thenReturn(response);

        RefreshSummary summary = tokenRefreshService.refreshAll();

        assertEquals(1, summary.getRefreshedCount());
        assertEquals(1, summary.getFailedCount());
        verify(pageService).logRefreshFailure("p1", "No token found in Vault");
        verify(pageService).updateTokenMetadata("p2");
    }
}
