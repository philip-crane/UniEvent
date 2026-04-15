# Facebook Event Integration

**Document Status:** Updated to reflect actual implementation (Phase 0-1 complete)
- Security hardening: ✅ Tokens in headers/bodies, not URLs; HTTPS enforced; masking in logs
- Core functionality: ✅ OAuth, token exchange, event ingestion, token refresh schedulers
- Database integration: ✅ Events stored with page/media references
- Error handling: ✅ Graceful degradation, per-page/event failure isolation

**Implementation Notes:**
- PageEntity.id is the Facebook page ID (not a separate facebook_page_id field)
- Tokens stored in Vault via RestClient (not VaultClient - that's read-only infrastructure)
- All secrets transmitted in POST bodies or Authorization headers
- Schedulers use background Spring TaskScheduling (not real-time webhooks)

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
- Secure storage: Tokens stored in HashiCorp Vault via RestClient, never in database
- Security-first: All secrets transmitted in POST bodies or Authorization headers, never in query parameters
- Token masking: All tokens masked in logs (first 10 chars + "...")
- HTTPS enforcement: RestClient uses HTTPS with default certificate verification

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

### 7. **FacebookAppSecurityUtil**

Utility for masking sensitive tokens in logs.

**Methods:**
- `maskToken(String token)` - Returns first 10 characters + "..." for safe logging

### 8. **RestClientSecurityConfig**

Spring configuration for global RestClient security.

**Provides:**
- Configured `SecureRestClientBuilder` bean with HTTPS enforcement
- Certificate verification enabled by default
- Foundation for future certificate pinning

### 9. **FacebookApiException**

Custom exception thrown by FacebookGraphApiService.

**Properties:**
- `statusCode` - HTTP status from Facebook
- `errorType` - Error type/code from Facebook

### Extended Services

**PageService:**
- `createOrUpdatePageFromFacebook(fbPageResponse)` - Create/update page from FB data
- `createOrFindPlace(name, street, city, zip, country)` - Create or find venue by location
- `refreshPageTokens()` - Batch token refresh for all pages
- `refreshToken(pageId)` - Refresh single page token metadata
- `getActivePages(pageable)` - Fetch paginated active pages (returns Page<PageDTO>)
- `getPagesToRefresh(pageable)` - Fetch pages needing token refresh
- `logRefreshFailure(pageId, errorMessage)` - Log token refresh failures

### Key Components in VaultService

**Token Operations (via RestClient):**
- `storePageToken(pageId, token)` - POST to /v1/secret/data/unievent/facebook/page_{pageId}
- `getPageToken(pageId)` - GET from /v1/secret/data/unievent/facebook/page_{pageId}
- `updatePageToken(pageId, newToken)` - POST to /v1/secret/data/unievent/facebook/page_{pageId}

**Implementation Details:**
- All three methods use RestClient (not VaultClient)
- VaultClient is for infrastructure-level connections only (read-only)
- Vault credentials in X-Vault-Token header
- Request/response format: JSON for KV v2 API
- Error handling: Proper HTTP status checking (404, null responses, etc.)

**EventService:**
- `ingestFacebookEvents(pageId)` - Fetch and ingest all events for a page
- `createOrUpdateFacebookEvent(pageId, fbEvent)` - Create/update single event from Facebook data

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

Ensure `PageEntity` has the following fields:
- `id` - Primary key (doubles as Facebook page ID)
- `token_status` - Token validity status (valid/expired)
- `token_expires_at` - Token expiration timestamp
- `token_expires_in_days` - Token TTL in days
- `token_refreshed_at` - Last successful token refresh
- `last_refresh_success` - Boolean flag
- `last_refresh_error` - Error message from last refresh attempt
- `last_refresh_attempt` - Timestamp of last refresh attempt

**Note:** PageEntity.id is the Facebook page ID; there is no separate `facebook_page_id` field

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

1. FacebookOAuthService.processFacebookPage(fbPageResponse)
   a. FacebookGraphApiService.getShortLivedToken(code)
      - POSTs to https://graph.facebook.com/v25/oauth/access_token
      - Request body (form-urlencoded): client_id, client_secret, code, redirect_uri
      - ** Credentials in body, NEVER in URL **
      - Returns short-lived token (~1-2 hours)
   
   b. FacebookGraphApiService.getLongLivedToken(shortToken)
      - POSTs to https://graph.facebook.com/v25/oauth/access_token
      - Request body (form-urlencoded): grant_type=fb_exchange_token, client_id, client_secret, fb_exchange_token
      - ** Credentials in body, NEVER in URL **
      - Returns long-lived token (~60 days)
   
   c. FacebookGraphApiService.getPagesFromUser(longLivedToken)
      - GETs https://graph.facebook.com/v25/me/accounts
      - Authorization header: "Bearer {userToken}"
      - ** Token in header, NEVER in query params **
      - Query params (public, non-sensitive): fields=id,name,access_token
      - Returns array of admin-controlled pages with their access tokens
   
   d. For each page:
      - VaultService.storePageToken(pageId, pageToken)
        * POSTs to Vault /v1/secret/data/unievent/facebook/page_{pageId}
        * Token in request body JSON, X-Vault-Token in header
      - PageService.createOrUpdatePageFromFacebook(fbPageResponse)
      - Creates PageEntity with token metadata

2. Return success response with list of pages

**SECURITY NOTES:**
- All credentials (client_secret, fb_exchange_token) transmitted in POST body, never URL query params
- All access tokens transmitted in Authorization headers or request bodies, never URL query params
- All sensitive values masked in logs: log.debug("Token: {}", FacebookAppSecurityUtil.maskToken(token))
```

---

## Event Ingestion

### Automatic Scheduling

Runs every 12 hours (43,200,000ms) via `FacebookIngestionScheduler`.

**Configuration:**
- `@Scheduled(fixedDelay = 43200000, initialDelay = 60000)`
- fixedDelay: 12 hours between ingestions
- initialDelay: 1 minute after startup before first run

### Processing Flow

```
1. FacebookIngestionScheduler.ingestFacebookEvents() [Every 12 hours]
2. Pageable pagination: PageRequest.of(pageNumber, PAGE_SIZE=50)
3. PageService.getActivePages(pageable) - Returns Page<PageDTO>
4. For each PageDTO in active pages:
   a. VaultService.getPageToken(pageId) - Retrieve from Vault
      - GETs /v1/secret/data/unievent/facebook/page_{pageId}
      - Parses response structure: response.data.data.access_token
      - Returns Optional<String>
   
   b. FacebookGraphApiService.getPageEvents(pageId, pageToken)
      - GETs https://graph.facebook.com/v25/{pageId}/events
      - Authorization header: "Bearer {pageToken}"
      - ** Token in header, NEVER in query params **
      - Query params (public): fields=..., type=upcoming, limit=100
      - Logs token masked: "token: token_"+first10chars+"..."
      - Returns List<FbEventResponse>
   
   c. For each FbEventResponse:
      i. FacebookEventMapper.mapToEventEntity(pageId, fbEvent)
         - Maps Facebook schema to EventEntity
         - PlaceService.createOrFindPlace(name, street, city, zip, country)
           * Searches by city+country combination
           * Creates new PlaceEntity if not found
           * Returns PlaceEntity (not DTO)
         - Generates event URL: https://facebook.com/events/{id}
      
      ii. MediaService.downloadAndStoreImage(coverUrl, filename) [if cover present]
          - Downloads image from Facebook CDN
          - Stores in SeaweedFS
          - Returns file ID or null
      
      iii. EventService.createOrUpdateFacebookEvent(pageId, fbEvent)
           - Sets page reference via PageEntity lookup
           - Sets cover image media reference if downloaded
           - Persists to database
      
      iv. Log success and continue to next event (errors don't stop other events)
   
   d. Log page completion and continue to next page (errors don't stop other pages)

5. Log batch completion with summary: success count, failure count, duration
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
| Place lookup | `PlaceEntity` search | PlaceService.createOrFindPlace() searches by city+country, creates if not found |
| `cover.source` | `MediaEntity.fileId` | Downloaded and stored in SeaweedFS |
| `is_canceled` | `EventEntity.isCanceled` | Boolean |
| `is_online` | `EventEntity.isOnline` | Boolean |
| N/A | `EventEntity.eventUrl` | Generated: `https://facebook.com/events/{id}` |

---

## Token Management

### Token Lifecycle

1. **Initial Token (OAuth)**
   - Short-lived: ~2 hours
   - Immediately exchanged for long-lived: ~60 days
   - Stored in Vault via VaultService.storePageToken()
   - Path: /v1/secret/data/unievent/facebook/page_{pageId}
   - JSON format with timestamps

2. **Monitoring**
   - Scheduler checks tokens every 45 days
   - Expiration tracked in `PageEntity.token_expires_at`
   - Last refresh attempt tracked in `last_refresh_attempt`

3. **Refresh (Every 45 days)**
   - FacebookTokenRefresher.refreshPageTokens() runs on 45-day schedule
   - **Configuration:** `@Scheduled(fixedDelay = 3888000000, initialDelay = 120000)`
   - fixedDelay: 45 days (3888000000ms) between refreshes
   - initialDelay: 2 minutes after startup before first run
   - For each page:
     a. VaultService.getPageToken(pageId) - Retrieve from Vault
     b. FacebookGraphApiService.refreshPageToken(currentToken)
        - POSTs to https://graph.facebook.com/v25/oauth/access_token
        - Request body: grant_type=fb_exchange_token, client_id, client_secret, fb_exchange_token
        - ** Token and credentials in body, NEVER in URL **
        - Returns FbLongLivedTokenResponse
     c. tokenResponse.getAccessToken() - Extract token
     d. VaultService.updatePageToken(pageId, newToken) - Store in Vault
     e. PageService.refreshToken(pageId) - Update metadata
   - Logs success/failure per page, continues despite individual failures

### Vault Storage

Tokens stored at:
```
/v1/secret/data/unievent/facebook/page_{PAGE_ID}
```

Vault KV v2 API format (POST request body):
```json
{
  "data": {
    "access_token": "EAABT...",
    "stored_at": "2024-01-15T12:34:56",
    "updated_at": "2024-01-20T10:20:30" (only set on updates)
  }
}
```

Vault response structure (retrieved via GET):
```json
{
  "data": {
    "data": {
      "access_token": "EAABT...",
      "stored_at": "2024-01-15T12:34:56",
      "updated_at": "2024-01-20T10:20:30"
    },
    "metadata": {...}
  }
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

## Security Implementation

### Token Protection

**All secrets are transmitted securely:**

1. **OAuth Secrets (client_id, client_secret, code, redirect_uri)**
   - Sent in POST request body (form-urlencoded)
   - NEVER in URL query parameters
   - Methods: getShortLivedToken(), getLongLivedToken(), refreshPageToken()

2. **Access Tokens (user token, page token)**
   - Sent in Authorization header: `Authorization: Bearer {token}`
   - NEVER in URL query parameters
   - Methods: getPagesFromUser(), getPageEvents()

3. **Token Storage in Vault**
   - Stored in request body JSON
   - Vault credentials in X-Vault-Token header
   - Path: /v1/secret/data/unievent/facebook/page_{pageId}
   - Never in URLs or query parameters

4. **Token Masking in Logs**
   - All log statements use FacebookAppSecurityUtil.maskToken()
   - Format: Shows first 10 characters + "..."
   - Example: `log.debug("Token: {}", FacebookAppSecurityUtil.maskToken(token))`
   - Prevents full token exposure in log files, rotation, archives

### HTTPS Enforcement

- RestClient uses HTTPS by default
- RestClientSecurityConfig provides global configuration
- Certificate verification enabled
- Vault default URI: https://localhost:8200 (updated from http://)

### Response Parsing Security

- Type-safe casting for JSON responses
- Checked for null/missing fields
- Proper error handling If "data" field missing
- No assumption of response structure

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
| Rate Limit | Too many API requests | Exponential backoff not yet implemented |

### Graceful Degradation

- Individual page failures don't block other pages (in schedulers)
- Individual event failures don't block other events
- Logged to application logs with context
- Scheduler continues despite errors
- Non-fatal errors (e.g., missing cover image) logged but don't block event creation

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
4. Check Vault connectivity: `vault status`
5. Check X-Vault-Token authentication is configured
6. Check RestClient error logs for HTTP errors from Vault
7. Verify token stored at correct path: `vault kv list secret/unievent/facebook/`

### Vault Errors When Storing/Retrieving Tokens

**Symptoms:** 404 or 403 errors in logs when accessing page tokens

**Solutions:**
1. Verify Vault KV v2 engine is enabled at `secret/`
2. Verify path format: Must be `/v1/secret/data/unievent/facebook/page_{pageId}` (includes `/data/`)
3. Check policy: `vault policy read unievent-app`
4. Verify token is stored: `vault kv get secret/unievent/facebook/page_123456789`
5. Ensure all pages have tokens stored before ingestion runs (initial OAuth must complete first)
6. Check Vault logs: `vault audit enable file file_path=/vault/logs/audit.log`

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

### 1. OAuth Callback Endpoint

```bash
# User is redirected here after approving Facebook permissions
# Query params provided by Facebook
GET https://yourdomain.com/api/facebook/callback?code=AUTH_CODE&state=STATE

# Response (JSON):
{
  "message": "Successfully connected pages",
  "pages_stored": 3,
  "pages": [
    {"id": "page_id_1", "name": "Page Name 1"},
    {"id": "page_id_2", "name": "Page Name 2"},
    {"id": "page_id_3", "name": "Page Name 3"}
  ]
}
```

**Note:** FacebookController.handleOAuthCallback builds this response

### 2. Check Page Token Status

```bash
# Query pages (implementation status varies)
curl http://localhost:8080/api/pages

# Response includes pages with token status
```

**Note:** Requires additional REST endpoint implementation

### 3. View Scheduler Status

```bash
# Check logs for scheduler execution
tail -f logs/application.log | grep FacebookIngestionScheduler
tail -f logs/application.log | grep FacebookTokenRefresher

# Expected output:
# [INFO] FacebookIngestionScheduler: Starting scheduled Facebook event ingestion
# [INFO] FacebookIngestionScheduler: Successfully ingested events for page: 12345
# [INFO] FacebookTokenRefresher: Successfully refreshed token for page: 12345
```

### 4. Database Query - Recent Events from Facebook

```sql
-- Events ingested from Facebook (from last 24 hours)
SELECT id, title, start_time, page_id, created_at
  FROM events
 WHERE page_id IN (
   SELECT id FROM pages WHERE id ~ '^[0-9]+$' -- Assumes FB page IDs are numeric strings
 ) AND created_at > NOW() - INTERVAL '1 day'
 ORDER BY created_at DESC;
```

### 5. Database Query - Token Status

```sql
-- Page token status and refresh timing
SELECT id, name, token_status, token_expires_at, last_refresh_success, last_refresh_attempt
  FROM pages
 WHERE id IS NOT NULL  -- Only pages with Facebook integration
 ORDER BY token_expires_at ASC;
```

### 6. Vault - Check Stored Tokens

```bash
# List all stored page tokens
vault kv list secret/unievent/facebook/

# Read specific token metadata
vault kv get secret/unievent/facebook/page_123456789

# Response:
# ============ Data ============
# Key              Value
# ---              -----
# access_token     EAABT...
# stored_at        2024-01-15T12:34:56
# updated_at       2024-01-20T10:20:30

# Delete token (if pages disconnected)
vault kv delete secret/unievent/facebook/page_123456789
```

### 7. Simulate Event Ingestion (via logs)

```bash
# Application startup, after 1 minute:
# [INFO] FacebookIngestionScheduler: Starting scheduled Facebook event ingestion

# Per page processing:
# [DEBUG] Fetching events for page: 123456789 (token: token_ABCDEFGHIJ...)
# [INFO] Retrieved 42 events from Facebook for page: 123456789
# [DEBUG] Processing Facebook event: My Event Name (event_id_987)
# [DEBUG] Downloading cover image for event: event_id_987
# [INFO] Successfully ingested events for page: 123456789 (success: 42, skipped: 0)

# Completion:
# [INFO] Facebook event ingestion completed. Success: 42, Failure: 0, Duration: 5234ms
```

### 8. Simulate Token Refresh (via logs)

```bash
# Application startup, after 2 minutes:
# [INFO] FacebookTokenRefresher: Starting scheduled Facebook page token refresh

# Per page processing:
# [DEBUG] Refreshing token for page: 123456789
# [DEBUG] Retrieved token from Vault for page: 123456789 (token: token_ABCDEFGHIJ...)
# [DEBUG] Obtained new token from Facebook for page: 123456789 (token: token_KLMNOPQRST...)
# [DEBUG] Stored new token in Vault for page: 123456789
# [INFO] Successfully refreshed token for page: 123456789

# Completion:
# [INFO] Facebook page token refresh completed. Refreshed: 3, Failed: 0, Duration: 2156ms
```

---

## Future Enhancements

### Ready for Implementation
1. **Manual Event Ingestion Endpoint** - POST /api/facebook/ingest/{pageId} to trigger ingestion immediately
2. **Page Management Endpoints** - GET/DELETE /api/facebook/pages to manage connected pages
3. **Token Status Endpoint** - GET /api/facebook/pages/{pageId}/token-status for token metadata
4. **Health Check Endpoint** - GET /api/facebook/health for Facebook API connectivity

### Medium Priority
5. **WebSocket Updates** - Real-time event push to connected clients when new events ingested
6. **Exponential Backoff** - Implement retry logic with exponential backoff for failed pages
7. **Event Filter Configuration** - Allow filtering by event type, category, timezone
8. **Analytics Dashboard** - Ingestion metrics: events processed, tokens refreshed, failures, duration

### Lower Priority / Future Consideration
9. **Webhook Integration** - Facebook webhooks for instant event updates (instead of 12h polling)
10. **Page-Level Configuration** - Per-page custom timezone, language, field filtering
11. **Admin Panel** - UI to manage connected pages, view token status, manual actions
12. **Custom Fields** - Store additional page metadata (category, verification, followers)
13. **Batch Token Refresh** - Single REST endpoint to refresh all tokens manually
14. **Event Deduplication** - Smarter duplicate detection (same event, different times)
15. **Rate Limiting** - Handle Facebook API rate limits (1000 calls/hour) gracefully

### Not Yet Addressed
- Certificate pinning for Vault REST calls
- Event change tracking (detect deleted/modified events)
- Webhook security validation (Facebook signature verification)
- Multi-page pagination optimization
- Database indexes for token/page queries

---

## References

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Facebook Events API](https://developers.facebook.com/docs/graph-api/reference/event)
- [Facebook OAuth Reference](https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow)
- [UniEvent Server Documentation](./README.md)
