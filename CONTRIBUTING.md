# Contributing
This document is the **technical** part of DTU Event documentation, for general users. For developer and contributor documentation, see [README.md](./README.md).

## Tech Stack

Backend:
- **Java 25** - Language and runtime
- **Maven** - Build tool
- **Docker** - Containerization for the following services:
	- **Spring Boot** - Application framework (Web, Data JPA, Validation, Actuator, OAuth2 Client)
	- **Nginx** - Reverse proxy, HTTPS termination
	- **Certbot** - SSL certificate issuance and renewal
	- **MySQL** - Relational database
	- **HashiCorp Vault** - Secret storage
	- **SeaweedFS** - Media/image storage. Has a Master and Volume.
- **Spring Mail + Thymeleaf** - Email sending with HTML templates
- **Lombok** - Boilerplate reduction (`@Data`, `@Builder`, etc.)
- **JJWT** - JWT token signing and validation
- **SpringDoc OpenAPI** - Auto-generated API docs + Swagger UI (`/swagger-ui.html`)
- **Jackson** - JSON serialization (including JSR310 for Java date/time types)
- **JPA / Hibernate** - ORM
- **H2** - Embedded DB for tests

Frontend:
- **TypeScript 5.8** - Language, a type-safe upgrade to JavaScript
- **Node.js** - Runtime environment
- **npm** - Package manager
- **React 19** - UI framework
- **Vite 7** - Build Tool
- **Tailwind CSS 4** - Styling
- **React Router v7** Routing
- **Lucide React** - Icon library
- **Vitest 4** - Test framework
- **ESLint 9** - Linting

## Setup

### Backend

Run `pwsh ./tools.ps1 setup`. On Mac/Linux, install PowerShell first. The command will:
- Check required dependencies (Java, Maven, cURL, Docker)
- Check for a root `.env` file, request one from the team if missing
- Generate self-signed TLS certs and create `docker-compose.override.yml` for local HTTPS
- Add `tools` to your PATH so you can run `tools` directly instead of `./tools.ps1`.

After setup the `tools` CLI is available - see `cli/` in the project structure below.

### Frontend

```bash
cd web
npm install
cp .env.example .env   # set VITE_BACKEND_URL=http://localhost:8080 for local dev
npm run dev            # http://localhost:5173
```

The backend needs to be running at `VITE_BACKEND_URL` for API calls to work.

## Project Structure

```text
UniEventServer/
├── .github/
│   └── workflows/
│       └── deploy-live.yml      # CI/CD: build gates + SSH deploy + docker compose up
├── cli/
│   ├── setup.ps1      # tools setup
│   ├── docker.ps1     # tools docker / tools docker -d (stop) / tools docker --wipe
│   ├── vault.ps1      # tools vault, tools unseal
│   ├── seed.ps1       # tools seed, tools seed --wipe
│   ├── ingest.ps1     # tools ingest [-p <pageId>]
│   ├── refresh.ps1    # tools refresh [-p <pageId>]
│   ├── invite.ps1     # tools invite [-e <email>] [-n <orgname>]
│   ├── status.ps1     # tools status (read-only Docker/Vault summary)
│   └── shared.ps1     # (shared helpers)
├── deploy/
│   ├── nginx.conf                # HTTP-only (cert bootstrap)
│   ├── nginx-dev.conf            # Local dev
│   └── nginx-https.conf          # Production HTTPS + reverse proxy
├── src/
│   ├── main/
│   │   ├── java/dk/unievent/app/
│   │   │   ├── api/
│   │   │   │   ├── controller/
│   │   │   │   ├── dto/
│   │   │   │   └── handler/
│   │   │   ├── application/
│   │   │   │   ├── dto/
│   │   │   │   ├── mapper/
│   │   │   │   ├── scheduler/
│   │   │   │   └── service/
│   │   │   ├── db/
│   │   │   │   ├── model/
│   │   │   │   └── repository/
│   │   │   ├── infrastructure/
│   │   │   │   ├── client/
│   │   │   │   ├── config/
│   │   │   │   ├── exception/
│   │   │   │   ├── filter/
│   │   │   │   └── security/
│   │   │   └── tools/            # Admin CLI endpoints (@Profile("dev"))
│   │   │       ├── controller/
│   │   │       ├── models/
│   │   │       └── services/
│   │   └── resources/
│   │       ├── templates/
│   │       │   └── emails/       # Thymeleaf email templates
│   │       ├── api.yaml
│   │       ├── application.yaml
│   │       ├── application-dev.yaml
│   │       ├── db.yaml
│   │       ├── media.yaml
│   │       └── vault.yaml
│   └── test/
│       ├── java/dk/unievent/app/
│       │   ├── api/
│       │   │   ├── controller/
│       │   │   └── handler/
│       │   ├── application/
│       │   │   ├── dto/
│       │   │   ├── mapper/
│       │   │   └── service/
│       │   ├── db/
│       │   │   ├── model/
│       │   │   └── repository/
│       │   ├── infrastructure/
│       │   │   ├── client/
│       │   │   ├── config/
│       │   │   ├── exception/
│       │   │   ├── filter/
│       │   │   └── util/
│       │   └── tools/
│       │       ├── controller/
│       │       └── services/
│       └── resources/
│           ├── application-test.yaml
│           ├── db-test.yaml
│           ├── logback-test.xml
│           └── vault-test.yaml
├── vault/
│   └── config/
│       └── policies/
├── web/
│   ├── public/
│   ├── src/
│   │   ├── components/          # Isolated UI pieces (no data fetching)
│   │   ├── context/             # React context providers (AuthContext)
│   │   ├── data/
│   │   ├── hooks/               # Stateful logic extracted from components (prefixed use*)
│   │   ├── pages/               # Full page views (own their data fetching)
│   │   ├── services/            # External connections
│   │   │   ├── dal.ts           # Data Access Layer - all REST API calls
│   │   │   ├── auth.ts          # JWT auth (login, signup, token storage)
│   │   │   ├── facebook.ts      # Facebook OAuth flow
│   │   │   └── likes.ts         # Likes persistence (localStorage + in-memory cache)
│   │   ├── styles/
│   │   ├── test/
│   │   │   ├── pages/
│   │   │   └── services/
│   │   ├── utils/               # Pure helpers used across multiple files
│   │   ├── main.tsx             # Entry point
│   │   ├── App.tsx
│   │   ├── router.tsx           # React Router config
│   │   └── types.ts             # Shared TypeScript interfaces
│   ├── Dockerfile               # Frontend nginx image
│   ├── nginx.conf               # SPA routing (all routes → index.html)
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── docker-compose.override.yml.example
├── Dockerfile                   # Backend image
├── pom.xml
└── tools.ps1                    # Entry point for the tools CLI
```

## Conventions

- **`components/`** - purely presentational, no fetch calls
- **`pages/`** - compose components, own their `useEffect` data fetching
- **`hooks/`** - extract stateful logic when a component gets complex; always prefix `use*`
- **`services/`** - all external calls live here, nowhere else
- **`utils/`** - if a helper is used in more than one file, it goes here

## API Endpoints

**Public (no auth):**
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/events` | List all events (paginated) |
| `GET` | `/api/events/future` | Upcoming events only |
| `GET` | `/api/events/{id}` | Single event |
| `GET` | `/api/events/page/{pageId}` | Events for a page |
| `GET` | `/api/events/page/{pageId}/future` | Upcoming events for a page |
| `GET` | `/api/events/place/{placeId}` | Events at a venue |
| `GET` | `/api/pages` | List all pages |
| `GET` | `/api/pages/active` | Active pages only |
| `GET` | `/api/pages/{id}` | Single page |
| `GET` | `/api/pages/search` | Search pages by name |
| `GET` | `/api/places/{id}` | Single place |
| `GET` | `/api/places/city/{city}` | Places in a city |
| `GET` | `/api/places/country/{country}` | Places in a country |
| `GET` | `/api/places/location/{city}/{country}` | Places in a city + country |
| `GET` | `/api/places/search` | Search places by name |
| `GET` | `/api/facebook/auth` | Start Facebook OAuth - returns signed state + auth URL |
| `GET` | `/api/facebook/callback` | Facebook OAuth callback - validates state, exchanges code for tokens |
| `GET` | `/api/facebook/health` | Facebook integration health check |
| `GET` | `/media/{id}` | Download media file |
| `GET` | `/media` | List all media files (paginated) |
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/organizer-key/verify` | Verify organizer invite key |
| `POST` | `/api/auth/register-with-key` | Register as organizer |

**Authenticated (Bearer token required):**
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/events` | Create event |
| `PUT` | `/api/events/{id}` | Update event |
| `DELETE` | `/api/events/{id}` | Delete event |
| `POST` | `/api/events/{id}/coverImage` | Upload cover image |
| `POST` | `/api/pages` | Create page |
| `PUT` | `/api/pages/{id}` | Update page |
| `POST` | `/api/pages/{id}/picture` | Upload page picture |
| `DELETE` | `/api/pages/{id}` | Delete page (cascades to events) |
| `POST` | `/api/places` | Create place |
| `PUT` | `/api/places/{id}` | Update place |
| `DELETE` | `/api/places/{id}` | Delete place |
| `POST` | `/media` | Upload media file |
| `POST` | `/api/auth/logout` | Logout |

**Admin only:**
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/auth/organizer-key/generate` | Generate organizer invite |

**Dev profile only (`@Profile("dev")`) - not available in production:**
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/admin/tools/ingest/{pageId}` | Manually ingest Facebook events for a page |
| `GET` | `/admin/tools/pages` | List all tracked pages with token status |
| `POST` | `/admin/tools/seed` | Seed test data |
| `DELETE` | `/admin/tools/seed` | Clear seeded test data |
| `POST` | `/admin/tools/refresh-tokens` | Refresh tokens for all pages |
| `POST` | `/admin/tools/refresh-tokens/{pageId}` | Refresh token for one page |

## Auth

Auth is JWT-based via the backend. The backend issues a short-lived access token and a long-lived refresh token on login. On the frontend, both tokens are stored in `localStorage` (`unievent_token`, `unievent_user`). The `AuthContext` + `useAuth()` hook expose the current user across the app. All authenticated API calls attach `Authorization: Bearer <token>` manually - there is no global interceptor.

## Likes

Likes are stored in `localStorage` per user (`unievent_likes_<uid>`), backed by an in-memory cache for performance. They are device-local. Cross-device sync would require backend endpoints (`/api/users/me/likes`) - tracked in the TODO.

## Tests

### Backend

```bash
./mvnw test
```

Uses H2 as an embedded in-memory database - no running MySQL needed. Test config lives in `src/test/resources/` (`application-test.yaml`, `db-test.yaml`, etc.).

### Frontend

```bash
cd web && npm test
```

Uses Vitest + jsdom. Note: `dal.test.ts` makes real fetch calls and requires the backend to be running - those tests will fail without it.

## Deployment

GitHub Actions deploys the full stack automatically on push to `live` (see [deploy-live.yml](.github/workflows/deploy-live.yml)).

**What the workflow does:**

1. Runs `./mvnw test` (backend) and `cd web && npm run build` (frontend) as CI gates - deploy never fires if either fails
2. SSHs to the server and pulls the monorepo at `LIVE_DEPLOY_PATH`
3. Writes `web/.env` from the `LIVE_FRONTEND_ENV` secret - this is necessary because `VITE_*` vars are baked into the JS bundle at Docker build time, so the file must exist before `docker compose up --build`
4. Runs `docker compose up -d --build --remove-orphans`, which rebuilds and restarts all services: Spring Boot backend, React frontend (nginx), MySQL, SeaweedFS, Vault, and the nginx edge

One deploy, one repo, everything updates together.

**Required GitHub Actions secrets:**

| Secret | Purpose |
|--------|---------|
| `LIVE_DEPLOY_SSH_KEY` | Private SSH key for server access |
| `LIVE_DEPLOY_KNOWN_HOSTS` | Server SSH host fingerprint |
| `LIVE_DEPLOY_HOST` | Server hostname or IP |
| `LIVE_DEPLOY_USER` | SSH username |
| `LIVE_DEPLOY_PATH` | Absolute path to the repo on the server |
| `LIVE_TLS_DOMAIN` | Domain for TLS cert (e.g. `unievent.dk`) |
| `LIVE_LETSENCRYPT_EMAIL` | Email for Let's Encrypt (first deploy only) |
| `LIVE_FRONTEND_ENV` | Production contents of `web/.env` |

## TODO

Backend

- [in progress] JWT auth - signed token, expiry, validation filter
- [in progress] Auto Facebook token refresh
- [ ] Fix the damn env situation
- [ ] Replace `ddl-auto: update` with Flyway migrations
- [ ] PicoCLI for proper tool CLI
- [ ] Pin Docker image versions
- [ ] DB: Quartz scheduler

### Frontend

- [in progress] Facebook Page Organizer onboarding flow
- [in progress] Mobile layout improvements
- [ ] Facebook OAuth login
- [ ] Organizer dashboard (event sync status, token expiry)
- [ ] Create Event page
- [ ] Business Manager integration for stable API access
- [ ] Persist likes to backend (`/api/users/me/likes`) - currently localStorage only