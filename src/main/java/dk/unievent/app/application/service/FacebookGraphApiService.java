package dk.unievent.app.application.service;

import dk.unievent.app.api.dto.*;
import dk.unievent.app.infrastructure.config.FacebookConfig;
import dk.unievent.app.infrastructure.exception.FacebookApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Encapsulates all Facebook Graph API v25 calls
 * Handles authentication, token exchange, and event fetching
 */
@Slf4j
@Service
public class FacebookGraphApiService {
    
    private static final String FB_GRAPH_BASE_URL = "https://graph.facebook.com";
    private final RestClient restClient;
    private final FacebookConfig facebookConfig;
    
    public FacebookGraphApiService(RestClient.Builder restClientBuilder, FacebookConfig facebookConfig) {
        this.restClient = restClientBuilder.baseUrl(FB_GRAPH_BASE_URL).build();
        this.facebookConfig = facebookConfig;
    }
    
    /**
     * Exchange authorization code for short-lived access token
     */
    public FbShortLivedTokenResponse getShortLivedToken(String code) {
        try {
            log.debug("Fetching short-lived token from Facebook");
            
            String url = "/{version}/oauth/access_token";
            
            return restClient.get()
                    .uri(url, facebookConfig.getGraphApiVersion())
                    .uri(builder -> builder
                            .queryParam("client_id", facebookConfig.getAppId())
                            .queryParam("client_secret", facebookConfig.getAppSecret())
                            .queryParam("code", code)
                            .queryParam("redirect_uri", facebookConfig.getRedirectUri())
                            .build())
                    .retrieve()
                    .body(FbShortLivedTokenResponse.class);
        } catch (RestClientResponseException e) {
            log.error("Failed to get short-lived token. Status: {}", e.getStatusCode());
            throw new FacebookApiException(
                    "Failed to exchange code for short-lived token: " + e.getMessage(),
                    e.getStatusCode().value(),
                    "SHORT_LIVED_TOKEN_ERROR"
            );
        }
    }
    
    /**
     * Exchange short-lived token for long-lived token (valid 60+ days)
     */
    public FbLongLivedTokenResponse getLongLivedToken(String shortLivedToken) {
        try {
            log.debug("Exchanging short-lived token for long-lived token");
            
            String url = "/{version}/oauth/access_token";
            
            return restClient.get()
                    .uri(url, facebookConfig.getGraphApiVersion())
                    .uri(builder -> builder
                            .queryParam("grant_type", "fb_exchange_token")
                            .queryParam("client_id", facebookConfig.getAppId())
                            .queryParam("client_secret", facebookConfig.getAppSecret())
                            .queryParam("fb_exchange_token", shortLivedToken)
                            .build())
                    .retrieve()
                    .body(FbLongLivedTokenResponse.class);
        } catch (RestClientResponseException e) {
            log.error("Failed to get long-lived token. Status: {}", e.getStatusCode());
            throw new FacebookApiException(
                    "Failed to exchange for long-lived token: " + e.getMessage(),
                    e.getStatusCode().value(),
                    "LONG_LIVED_TOKEN_ERROR"
            );
        }
    }
    
    /**
     * Fetch all pages administered by the user
     */
    public List<FbPageResponse> getPagesFromUser(String userAccessToken) {
        try {
            log.debug("Fetching pages for user");
            
            String url = "/{version}/me/accounts";
            
            var response = restClient.get()
                    .uri(url, facebookConfig.getGraphApiVersion())
                    .uri(builder -> builder
                            .queryParam("access_token", userAccessToken)
                            .queryParam("fields", "id,name,access_token")
                            .build())
                    .retrieve()
                    .body(Map.class);
            
            if (response == null || !response.containsKey("data")) {
                log.warn("No pages data in response");
                return List.of();
            }
            
            log.debug("Retrieved {} pages from user", ((List<?>) response.get("data")).size());
            return (List<FbPageResponse>) response.get("data");
        } catch (RestClientResponseException e) {
            log.error("Failed to get pages. Status: {}", e.getStatusCode());
            throw new FacebookApiException(
                    "Failed to fetch user pages: " + e.getMessage(),
                    e.getStatusCode().value(),
                    "PAGES_FETCH_ERROR"
            );
        }
    }
    
    /**
     * Fetch upcoming events for a specific page
     */
    public List<FbEventResponse> getPageEvents(String pageId, String pageAccessToken) {
        try {
            log.debug("Fetching events for page: {}", pageId);
            
            String url = "/{version}/{pageId}/events";
            
            var response = restClient.get()
                    .uri(url, facebookConfig.getGraphApiVersion(), pageId)
                    .uri(builder -> builder
                            .queryParam("access_token", pageAccessToken)
                            .queryParam("fields", "id,name,description,start_time,end_time,place,cover,event_times,timezone,is_canceled,is_online,is_page_owned")
                            .queryParam("type", "upcoming")
                            .queryParam("limit", "100")
                            .build())
                    .retrieve()
                    .body(Map.class);
            
            if (response == null || !response.containsKey("data")) {
                log.warn("No events data in response for page: {}", pageId);
                return List.of();
            }
            
            log.debug("Retrieved {} events for page: {}", ((List<?>) response.get("data")).size(), pageId);
            return (List<FbEventResponse>) response.get("data");
        } catch (RestClientResponseException e) {
            log.error("Failed to get events for page {}. Status: {}", pageId, e.getStatusCode());
            throw new FacebookApiException(
                    "Failed to fetch events for page " + pageId + ": " + e.getMessage(),
                    e.getStatusCode().value(),
                    "EVENTS_FETCH_ERROR"
            );
        }
    }
    
    /**
     * Refresh an expired page access token
     */
    public FbLongLivedTokenResponse refreshPageToken(String expiredPageToken) {
        try {
            log.debug("Refreshing page access token");
            
            String url = "/{version}/oauth/access_token";
            
            return restClient.get()
                    .uri(url, facebookConfig.getGraphApiVersion())
                    .uri(builder -> builder
                            .queryParam("grant_type", "fb_exchange_token")
                            .queryParam("client_id", facebookConfig.getAppId())
                            .queryParam("client_secret", facebookConfig.getAppSecret())
                            .queryParam("fb_exchange_token", expiredPageToken)
                            .build())
                    .retrieve()
                    .body(FbLongLivedTokenResponse.class);
        } catch (RestClientResponseException e) {
            log.error("Failed to refresh page token. Status: {}", e.getStatusCode());
            throw new FacebookApiException(
                    "Failed to refresh page token: " + e.getMessage(),
                    e.getStatusCode().value(),
                    "TOKEN_REFRESH_ERROR"
            );
        }
    }
}
