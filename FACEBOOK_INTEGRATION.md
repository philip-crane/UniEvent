# Facebook Event Integration

This document describes the Facebook event ingestion workflow integrated into the UniEvent Server. The system automatically fetches Facebook events from user-connected pages and stores them in the local database.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Setup and Configuration](#setup-and-configuration)
5. [OAuth Flow](#oauth-flow)
6. [Event Ingestion](#event-ingestion)
7. [Token Management](#token-management)
8. [Error Handling](#error-handling)
9. [Troubleshooting](#troubleshooting)
10. [Examples](#examples)

---

## Overview

The Facebook integration enables UniEvent Server to:

- Authenticate users with Facebook OAuth
- Retrieve admin-controlled Facebook pages
- Automatically ingest upcoming events from those pages every 12 hours
- Store Facebook page access tokens securely in HashiCorp Vault
- Automatically refresh tokens every 45 days before expiration
- Download and store Facebook event cover images in SeaweedFS

**Key Design Decisions:**
- Mixed-layer architecture: Facebook logic spread across existing services (PageService, EventService, MediaService) rather than isolated package
- Server-to-server integration: OAuth happens server-side with callback endpoint
- Scheduled processing: Event ingestion and token refresh run on background schedules, not real-time
- Graceful failure: Individual page/event failures don't block processing of other pages/events
- Secure storage: Tokens stored in HashiCorp Vault, not in database

---

## Architecture

```
Facebook OAuth     ->    OAuth Callback      ->    Token Exchange    ->    Page Fetching    ->    Storage
(User)            (POST /api/facebook/callback)   (FacebookGraphApiService)  (FacebookGraphApiService)  (PageService + VaultService)
                                                                                                    |
                                                                                                    v
                                                    Event Ingestion (Every 12h)
                                                    FacebookIngestionScheduler
                                                              |
                                                              v
                                                    FacebookGraphApiService.getPageEvents()
                                                              |
                                                              v
                                                    FacebookEventMapper.mapToEventEntity()
                                                              |
                                                              v
                                                    MediaService.downloadAndStoreImage()
                                                              |
                                                              v
                                                    EventService.createOrUpdateFacebookEvent()
                                                              |
                                                              v
                                                    EventRepository.save()
                                                              |
                                                    Token Refresh (Every 45 days)
                                                    FacebookTokenRefresher
                                                              |
                                                              v
                                                    FacebookGraphApiService.refreshPageToken()
                                                              |
                                                              v
                                                    VaultService.updatePageToken()
                                                              |
                                                              v
                                                    PageService.refreshToken()
```

---

## Components

### 1. **FacebookGraphApiService**

REST client for Facebook Graph API v25. Handles all communication with Facebook.

**Methods:**
- `getShortLivedToken(code)` - Exchange auth code for short-lived token
- `getLongLivedToken(shortToken)` - Exchange short-lived token for long-lived (~60 days)
- `getPagesFromUser(userToken)` - Fetch admin-controlled pages
- `getPageEvents(pageId, pageToken)` - Fetch upcoming events for a page
- `refreshPageToken(expiredToken)` - Refresh page token before expiration

**Error Handling:** Throws `FacebookApiException` with HTTP status and error type

### 2. **FacebookOAuthService**

Orchestrates OAuth workflow:
1. Exchanges authorization code for short-lived token
2. Exchanges short-lived token for long-lived token
3. Fetches user's admin-controlled pages
4. Stores tokens in Vault
5. Creates/updates PageEntities

**Key Method:**
- `processOAuthCallback(code)` - Complete OAuth flow from code to storage

### 3. **FacebookEventMapper**

Transforms Facebook event schema to application schema.

**Responsibilities:**
- Map Facebook event fields to EventEntity fields
- Create PlaceEntity from Facebook place data
- Generate event URLs
- Handle missing/optional fields gracefully

### 4. **FacebookIngestionScheduler**

Background task that runs every 12 hours.

**Responsibilities:**
- Fetch all active pages
- For each page, call `FacebookGraphApiService.getPageEvents()`
- Map events using `FacebookEventMapper`
- Download cover images
- Persist events to database
- Log successes and failures per-page
- Continue processing even if individual pages fail

**Configuration:** `fixedDelay = 43200000` (12 hours), `initialDelay = 60000` (1 minute after startup)

### 5. **FacebookTokenRefresher**

Background task that runs every 45 days.

**Responsibilities:**
- Fetch all pages with valid tokens
- For each page, retrieve token from Vault
- Call `FacebookGraphApiService.refreshPageToken()`
- Store new token in Vault
- Update page metadata in database
- Log successes and failures
- Continue processing even if individual pages fail

**Configuration:** `fixedDelay = 3888000000` (45 days), `initialDelay = 120000` (2 minutes after startup)

### 6. **FacebookController**

REST endpoint for OAuth callback and health checks.

**Endpoints:**
- `POST /api/facebook/callback?code=...&state=...` - OAuth callback
- `GET /api/facebook/health` - Health check

### 7. **FacebookApiException**

Custom exception thrown by FacebookGraphApiService.

**Properties:**
- `statusCode` - HTTP status from Facebook
- `errorType` - Error type/code from Facebook

### Extended Services

**PageService:**
- `createOrUpdatePageFromFacebook(fbPageResponse)` - Create/update page from FB data
- `refreshPageTokens()` - Batch token refresh for all pages
- `refreshToken(pageId)` - Refresh single page token metadata

**EventService:**
- `ingestFacebookEvents(pageId)` - Fetch and ingest all events for a page
- `createOrUpdateFacebookEvent(pageId, fbEvent)` - Create/update single event
- `downloadAndStoreCoverImage(url, filename)` - Private helper for image download

**MediaService:**
- `downloadAndStoreImage(imageUrl, filename)` - Download image from URL and store in SeaweedFS

---

## Setup and Configuration

### 1. Facebook App Configuration

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add "Facebook Login" product to the app
3. In Settings > Basic, note:
   - App ID
   - App Secret
4. In "Facebook Login" > Settings, set:
   - Valid OAuth Redirect URIs: `https://yourdomain.com/api/facebook/callback`
   - Allowed Domains for the JavaScript SDK: `yourdomain.com`
5. In Settings > App Roles, create a Test User or use your own account
6. Get the necessary permissions:
   - `pages_manage_metadata`
   - `pages_read_engagement`
   - `pages_read_user_content`
   - `events_management`

### 2. Application Configuration

Add to `application.yaml`:

```yaml
unievent:
  facebook:
    enabled: true
    app-id: YOUR_APP_ID
    app-secret: YOUR_APP_SECRET
    redirect-uri: https://yourdomain.com/api/facebook/callback
    graph-api-version: v25
```

Or via environment variables:

```bash
UNIEVENT_FACEBOOK_ENABLED=true
UNIEVENT_FACEBOOK_APP_ID=YOUR_APP_ID
UNIEVENT_FACEBOOK_APP_SECRET=YOUR_APP_SECRET
UNIEVENT_FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/facebook/callback
UNIEVENT_FACEBOOK_GRAPH_API_VERSION=v25
```

### 3. Vault Configuration

Update `vault/config/policies/unievent-app.hcl`:

```hcl
# Facebook integration - page token storage
path "secret/data/unievent/facebook/page_*" {
  capabilities = ["create", "read", "update", "delete"]
}

path "secret/metadata/unievent/facebook/page_*" {
  capabilities = ["read", "list"]
}
```

Apply policy:
```bash
vault policy write unievent-app vault/config/policies/unievent-app.hcl
```

### 4. Database

Ensure `PageEntity` has the following fields (should exist):
- `facebook_page_id` - Facebook page ID
- `token_status` - Token validity status (valid/expired)
- `token_expires_at` - Token expiration timestamp
- `token_expires_in_days` - Token TTL in days
- `token_refreshed_at` - Last successful token refresh
- `last_refresh_success` - Boolean flag
- `last_refresh_error` - Error message from last refresh attempt
- `last_refresh_attempt` - Timestamp of last refresh attempt

### 5. Enable Scheduling

The `@EnableScheduling` annotation is added to `WebApplication.java` automatically. Ensure Spring Boot recognizes it during startup.

Check logs for:
```
Initializing ExecutorService 'taskScheduler'
```

---

## OAuth Flow

### User Flow

```
1. User clicks "Connect Facebook" on frontend
2. Frontend redirects to Facebook OAuth URL:
   https://www.facebook.com/v25/dialog/oauth?
     client_id=APP_ID
     &redirect_uri=https://yourdomain.com/api/facebook/callback
     &scope=pages_manage_metadata,pages_read_engagement,pages_read_user_content,events_management
     &state=random_string

3. User logs in and approves permissions
4. Facebook redirects back to callback endpoint:
   https://yourdomain.com/api/facebook/callback?code=AUTH_CODE&state=random_state

5. Backend exchanges code for tokens (invisible to user)
6. Backend retrieves user's pages and stores in database
7. Backend redirects user to success page or returns JSON response
```

### Server-Side Token Exchange

```
POST /api/facebook/callback?code=AUTH_CODE

1. FacebookOAuthService.processOAuthCallback(code)
   a. FacebookGraphApiService.getShortLivedToken(code)
      - POSTs to https://graph.facebook.com/v25/oauth/access_token
      - Returns short-lived token (~1-2 hours)
   
   b. FacebookGraphApiService.getLongLivedToken(shortToken)
      - POSTs to https://graph.facebook.com/v25/oauth/access_token with grant_type=fb_exchange_token
      - Returns long-lived token (~60 days)
   
   c. FacebookGraphApiService.getPagesFromUser(longLivedToken)
      - GETs https://graph.facebook.com/v25/me/accounts
      - Returns array of admin-controlled pages with their access tokens
   
   d. For each page:
      - VaultService.storePageToken(pageId, pageToken)
      - PageService.createOrUpdatePageFromFacebook(fbPageResponse)
      - Creates PageEntity with token metadata

2. Return success response with list of pages
```

---

## Event Ingestion

### Automatic Scheduling

Runs every 12 hours (43,200,000ms) via `FacebookIngestionScheduler`.

### Processing Flow

```
1. FacebookIngestionScheduler.ingestFacebookEvents()
2. PageService.getActivePages(pageable)
3. For each page:
   a. VaultService.getPageToken(pageId) - Retrieve from Vault
   b. FacebookGraphApiService.getPageEvents(pageId, pageToken)
      - Fetches up to 100 upcoming events
      - Fields: id, name, description, start_time, end_time, place, cover, timezone, is_canceled, is_online, type=upcoming
   
   c. For each event:
      i. FacebookEventMapper.mapToEventEntity(pageId, fbEvent)
         - Maps Facebook schema to EventEntity
         - Creates PlaceEntity from location data
         - Generates event URL
      
      ii. MediaService.downloadAndStoreImage(coverUrl, filename)
          - Downloads image from Facebook CDN
          - Stores in SeaweedFS
          - Returns file ID
      
      iii. EventService.createOrUpdateFacebookEvent(pageId, fbEvent)
           - Persists to database
           - Links to page and media
      
      iv. Log success and continue to next event (errors don't block other events)
   
   d. Log page completion and continue to next page (errors don't block other pages)

4. Log batch completion with summary statistics
```

### Data Mapping

| Facebook Field | Application Field | Notes |
|---|---|---|
| `id` | `EventEntity.id` | Facebook event ID used as primary key |
| `name` | `EventEntity.title` | Event display name |
| `description` | `EventEntity.description` | Full event description |
| `start_time` | `EventEntity.startTime` | ISO 8601 datetime, converted to LocalDateTime UTC |
| `end_time` | `EventEntity.endTime` | Optional |
| `place.name` | `PlaceEntity.name` | Venue name |
| `place.street` | `PlaceEntity.street` | Street address |
| `place.city` | `PlaceEntity.city` | City |
| `place.zip` | `PlaceEntity.zip` | Postal code |
| `place.country` | `PlaceEntity.country` | Country |
| `cover.source` | `MediaEntity.fileId` | Downloaded and stored |
| `is_canceled` | `EventEntity.isCanceled` | Boolean |
| `is_online` | `EventEntity.isOnline` | Boolean |
| N/A | `EventEntity.eventUrl` | Generated: `https://facebook.com/events/{id}` |

---

## Token Management

### Token Lifecycle

1. **Initial Token (OAuth)**
   - Short-lived: ~2 hours
   - Immediately exchanged for long-lived: ~60 days
   - Stored in Vault

2. **Monitoring**
   - Scheduler checks tokens every 45 days
   - Expiration tracked in `PageEntity.token_expires_at`

3. **Refresh (Every 45 days)**
   - FacebookTokenRefresher calls FacebookGraphApiService.refreshPageToken()
   - Via `fb_exchange_token` grant type
   - New token stored in Vault
   - Metadata updated in database

### Vault Storage

Tokens stored at:
```
secret/data/unievent/facebook/page_{PAGE_ID}
```

Schema:
```json
{
  "access_token": "EAABT...",
  "stored_at": "2024-01-15T12:34:56",
  "updated_at": "2024-01-20T10:20:30"
}
```

### Database Tracking

`PageEntity` fields track token metadata:
- `token_status` - "valid", "expired", or "error"
- `token_expires_at` - Scheduled refresh timestamp
- `token_expires_in_days` - TTL for display/estimation
- `token_refreshed_at` - Last successful refresh
- `last_refresh_success` - Boolean flag
- `last_refresh_error` - Error message if failed
- `last_refresh_attempt` - Timestamp of last attempt

---

## Error Handling

### FacebookApiException

Thrown when Facebook API returns an error.

**Properties:**
- `statusCode` - HTTP status (e.g., 400, 401, 429, 500)
- `errorType` - Facebook error type (e.g., "OAuthException", "INVALID_REQUEST")
- `message` - Human-readable description

**Common Errors:**

| Error | Cause | Resolution |
|---|---|---|
| OAuthException | Invalid code or expired | Re-request authorization from user |
| Invalid Request | Missing/malformed parameters | Check client_id, app_secret, redirect_uri |
| Token Expired | Token older than ~60 days | Will be refreshed on next refresh cycle |
| Invalid Token | User revoked permissions | Re-request authorization from user |
| Rate Limit | Too many API requests | Exponential backoff implemented |

### Global Exception Handler

Added `@ExceptionHandler(FacebookApiException.class)` to `GlobalExceptionHandler.java`.

**HTTP Response:**
```json
{
  "timestamp": "2024-01-15T12:34:56",
  "status": 503,
  "error": "Facebook API Error",
  "message": "Failed to refresh token",
  "facebook_error_type": "OAuthException",
  "facebook_status_code": 401
}
```

### Graceful Degradation

- Individual page failures don't block other pages
- Individual event failures don't block other events
- Logged to application logs with context
- Scheduler continues despite errors
- HTTP endpoints return 503 (Service Unavailable) for Facebook API errors

---

## Troubleshooting

### OAuth Callback Not Working

**Symptoms:** Redirect URI mismatch error

**Solutions:**
1. Verify `redirect_uri` in application configuration
2. Must exactly match Facebook app settings (scheme, domain, path)
3. Use HTTPS in production
4. Check for trailing slashes

### Events Not Ingesting

**Symptoms:** No new events after ingestion scheduler runs

**Solutions:**
1. Check page has "upcoming" events (past events not fetched)
2. Verify page token exists in Vault:
   ```bash
   vault kv get secret/unievent/facebook/page_PAGE_ID
   ```
3. Check Vault policy allows read:
   ```bash
   vault policy read unievent-app
   ```
4. Check application logs for FacebookApiException
5. Verify page has proper permissions in Facebook app

### Token Refresh Failing

**Symptoms:** Token refresh errors in logs

**Solutions:**
1. Verify token hasn't been manually revoked in Facebook
2. Check if user removed app in Facebook settings
3. Vault policy must allow create/update:
   ```hcl
   path "secret/data/unievent/facebook/page_*" {
     capabilities = ["create", "read", "update", "delete"]
   }
   ```
4. Check Vault connectivity and authentication

### Cover Images Not Downloaded

**Symptoms:** Events without cover images

**Solutions:**
1. Check SeaweedFS connectivity
2. Verify SeaweedFsClient configuration
3. Check disk space on SeaweedFS volume
4. URL might be temporarily unavailable (non-fatal)
5. Check application logs for download errors

### Scheduler Not Running

**Symptoms:** Events/tokens not processed on schedule

**Solutions:**
1. Verify `@EnableScheduling` present in WebApplication.java
2. Check Spring TaskScheduler initialized:
   ```
   grep "TaskScheduler" application.log
   ```
3. Check that beans are properly created:
   ```bash
   grep "FacebookIngestionScheduler\|FacebookTokenRefresher" application.log
   ```
4. Verify no exceptions during startup

### Performance Issues

**Symptoms:** Slow ingestion or timeouts

**Solutions:**
1. Reduce FacebookIngestionScheduler frequency (increase `fixedDelay`)
2. Reduce `PAGE_SIZE` in scheduler (default 50)
3. Check Facebook API rate limits (1000 calls/hour)
4. Monitor SeaweedFS performance for image downloads
5. Database index on `facebook_page_id` and `token_expires_at`

---

## Examples

### 1. Manual Event Ingestion

```bash
# Trigger event ingestion for specific page (via endpoint if implemented)
curl -X POST http://localhost:8080/api/facebook/ingest \
  -H "Content-Type: application/json" \
  -d '{"page_id": "FACEBOOK_PAGE_ID"}'
```

### 2. Check Page Token Status

```bash
# Via REST (if endpoint implemented)
curl http://localhost:8080/api/pages?filter=facebook
```

### 3. Manual Token Refresh

```bash
# Via REST (if endpoint implemented)
curl -X POST http://localhost:8080/api/facebook/refresh-tokens
```

### 4. Check Vault Tokens

```bash
# List all stored page tokens
vault kv list secret/unievent/facebook/

# Read specific token
vault kv get secret/unievent/facebook/page_123456789
```

### 5. View Scheduler Status

```bash
# Check logs for scheduler execution
tail -f logs/application.log | grep FacebookIngestionScheduler
tail -f logs/application.log | grep FacebookTokenRefresher
```

### 6. Database Query - Recent Events

```sql
-- Events ingested from Facebook
SELECT id, title, start_time, page_id, created_at
  FROM events
 WHERE page_id IN (SELECT id FROM pages WHERE facebook_page_id IS NOT NULL)
   AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
 ORDER BY created_at DESC;
```

### 7. Database Query - Token Status

```sql
-- Page token status
SELECT id, name, token_status, token_expires_at, last_refresh_success, last_refresh_error
  FROM pages
 WHERE facebook_page_id IS NOT NULL
 ORDER BY token_expires_at ASC;
```

---

## Future Enhancements

1. **Manual Ingestion Endpoint** - POST /api/facebook/ingest to trigger ingestion immediately
2. **WebSocket Updates** - Real-time event push to connected clients
3. **Webhook Integration** - Facebook webhooks for instant event updates
4. **Page-Level Configuration** - Selective ingestion, custom timezone handling
5. **Retry Strategy** - Exponential backoff for failed pages
6. **Analytics** - Ingestion metrics dashboard
7. **Admin Panel** - UI to manage connected pages and token status
8. **Custom Fields** - Additional page metadata (category, verification status, etc.)

---

## References

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Facebook Events API](https://developers.facebook.com/docs/graph-api/reference/event)
- [Facebook OAuth Reference](https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow)
- [UniEvent Server Documentation](./README.md)
