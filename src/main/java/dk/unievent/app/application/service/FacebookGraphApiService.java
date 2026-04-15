package dk.unievent.app.application.service;

import dk.unievent.app.api.dto.*;
import dk.unievent.app.infrastructure.config.FacebookConfig;
import dk.unievent.app.infrastructure.exception.FacebookApiException;
import dk.unievent.app.infrastructure.util.FacebookAppSecurityUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

/**
 * Encapsulates all Facebook Graph API v25 calls with security hardening.
 * 
 * Security measures:
 * - OAuth secrets transmitted in POST body, never in URL query params
 * - Access tokens transmitted in Authorization header, never in query params
 * - All sensitive data masked in logs
 * - HTTPS enforcement via RestClient configuration
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
     * Exchange authorization code for short-lived access token.
     * Uses POST with form body (never GET with query params for security).
     *
     * @param code Authorization code from Facebook callback
     * @return Short-lived token response (valid ~2 hours)
     * @throws FacebookApiException if token exchange fails
     */
    public FbShortLivedTokenResponse getShortLivedToken(String code) {
        try {
            log.debug("Exchanging authorization code for short-lived token");
            
            // Build request body with credentials (secure - not in URL)
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", facebookConfig.getAppId());
            body.add("client_secret", facebookConfig.getAppSecret());
            body.add("code", code);
            body.add("redirect_uri", facebookConfig.getRedirectUri());
            
            String uri = "/{version}/oauth/access_token";
            
            return restClient.post()
                    .uri(uri, facebookConfig.getGraphApiVersion())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(FbShortLivedTokenResponse.class);
                    
        } catch (RestClientResponseException e) {
            log.error("Failed to get short-lived token. Status: {}", e.getStatusCode());
            throw new FacebookApiException(
                    "Failed to exchange code for short-lived token",
                    e.getStatusCode().value(),
                    "SHORT_LIVED_TOKEN_ERROR"
            );
        }
    }
    
    /**
     * Exchange short-lived token for long-lived token.
     * Uses POST with form body (never GET with query params for security).
     *
     * @param shortLivedToken Short-lived token to exchange
     * @return Long-lived token response (valid ~60 days)
     * @throws FacebookApiException if token exchange fails
     */
    public FbLongLivedTokenResponse getLongLivedToken(String shortLivedToken) {
        try {
            log.debug("Exchanging short-lived token for long-lived token");
            
            // Build request body with credentials (secure - not in URL)
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "fb_exchange_token");
            body.add("client_id", facebookConfig.getAppId());
            body.add("client_secret", facebookConfig.getAppSecret());
            body.add("fb_exchange_token", shortLivedToken);
            
            String uri = "/{version}/oauth/access_token";
            
            return restClient.post()
                    .uri(uri, facebookConfig.getGraphApiVersion())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(FbLongLivedTokenResponse.class);
                    
        } catch (RestClientResponseException e) {
            log.error("Failed to get long-lived token. Status: {}", e.getStatusCode());
            throw new FacebookApiException(
                    "Failed to exchange token for long-lived token",
                    e.getStatusCode().value(),
                    "LONG_LIVED_TOKEN_ERROR"
            );
        }
    }
    
    /**
     * Fetch user's admin-controlled Facebook pages.
     * Token transmitted in Authorization header for security (not query param).
     *
     * @param userToken User's long-lived access token
     * @return List of pages with their data
     * @throws FacebookApiException if API call fails
     */
    public List<FbPageResponse> getPagesFromUser(String userToken) {
        try {
            log.debug("Fetching admin-controlled pages for user (token: {})", FacebookAppSecurityUtil.maskToken(userToken));
            
            // Build URI with query params (not sensitive)
            URI uri = UriComponentsBuilder
                    .fromPath("/{version}/me/accounts")
                    .queryParam("fields", "id,name,access_token")
                    .buildAndExpand(facebookConfig.getGraphApiVersion())
                    .toUri();
            
            var response = restClient.get()
                    .uri(uri)
                    .header("Authorization", "Bearer " + userToken)
                    .retrieve()
                    .body(Object.class);
            
            if (response == null) {
                log.warn("Empty response from Facebook pages endpoint");
                return List.of();
            }
            
            // Safely cast response
            Map<String, Object> responseMap = (Map<String, Object>) response;
            if (!responseMap.containsKey("data")) {
                log.warn("No 'data' field in Facebook response");
                return List.of();
            }
            
            List<FbPageResponse> pages = (List<FbPageResponse>) responseMap.get("data");
            log.debug("Retrieved {} pages from user", pages.size());
            return pages;
            
        } catch (RestClientResponseException e) {
            log.error("Failed to fetch user pages. Status: {}", e.getStatusCode());
            throw new FacebookApiException(
                    "Failed to fetch user pages",
                    e.getStatusCode().value(),
                    "PAGES_FETCH_ERROR"
            );
        }
    }
    
    /**
     * Fetch upcoming events for a Facebook page.
     * Token transmitted in Authorization header for security (not query param).
     *
     * @param pageId Facebook page ID
     * @param pageToken Page access token
     * @return List of upcoming events
     * @throws FacebookApiException if API call fails
     */
    public List<FbEventResponse> getPageEvents(String pageId, String pageToken) {
        try {
            log.debug("Fetching events for page: {} (token: {})", pageId, FacebookAppSecurityUtil.maskToken(pageToken));
            
            // Build URI with query params (not sensitive)
            String fields = "id,name,description,start_time,end_time,place,cover,timezone,is_canceled,is_online,type";
            URI uri = UriComponentsBuilder
                    .fromPath("/{version}/{pageId}/events")
                    .queryParam("fields", fields)
                    .queryParam("type", "upcoming")
                    .queryParam("limit", 100)
                    .buildAndExpand(facebookConfig.getGraphApiVersion(), pageId)
                    .toUri();
            
            var response = restClient.get()
                    .uri(uri)
                    .header("Authorization", "Bearer " + pageToken)
                    .retrieve()
                    .body(Object.class);
            
            if (response == null) {
                log.warn("Empty response from Facebook events endpoint for page: {}", pageId);
                return List.of();
            }
            
            // Safely cast response
            Map<String, Object> responseMap = (Map<String, Object>) response;
            if (!responseMap.containsKey("data")) {
                log.warn("No 'data' field in Facebook events response for page: {}", pageId);
                return List.of();
            }
            
            List<FbEventResponse> events = (List<FbEventResponse>) responseMap.get("data");
            log.debug("Retrieved {} events for page: {}", events.size(), pageId);
            return events;
            
        } catch (RestClientResponseException e) {
            log.error("Failed to fetch events for page: {}. Status: {}", pageId, e.getStatusCode());
            throw new FacebookApiException(
                    "Failed to fetch page events",
                    e.getStatusCode().value(),
                    "EVENTS_FETCH_ERROR"
            );
        }
    }
    
    /**
     * Refresh an expired page access token.
     * Uses POST with form body (never GET with query params for security).
     *
     * @param expiredToken Expired page access token to refresh
     * @return New long-lived token response (valid ~60 days)
     * @throws FacebookApiException if token refresh fails
     */
    public FbLongLivedTokenResponse refreshPageToken(String expiredToken) {
        try {
            log.debug("Refreshing page token (token: {})", FacebookAppSecurityUtil.maskToken(expiredToken));
            
            // Build request body with credentials (secure - not in URL)
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "fb_exchange_token");
            body.add("client_id", facebookConfig.getAppId());
            body.add("client_secret", facebookConfig.getAppSecret());
            body.add("fb_exchange_token", expiredToken);
            
            String uri = "/{version}/oauth/access_token";
            
            return restClient.post()
                    .uri(uri, facebookConfig.getGraphApiVersion())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(FbLongLivedTokenResponse.class);
                    
        } catch (RestClientResponseException e) {
            log.error("Failed to refresh page token. Status: {}", e.getStatusCode());
            throw new FacebookApiException(
                    "Failed to refresh page token",
                    e.getStatusCode().value(),
                    "TOKEN_REFRESH_ERROR"
            );
        }
    }
}
