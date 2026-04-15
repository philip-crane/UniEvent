
# Setup

1. Get .env file and place in root
2. Copy and rename the override file:
   - Windows cmd: `copy docker-compose.override.yml.example docker-compose.override.yml`
   - Windows PowerShell: `Copy-Item docker-compose.override.yml.example docker-compose.override.yml`
   - Linux/Mac/Git Bash: `cp docker-compose.override.yml.example docker-compose.override.yml`
3. Generate a self-signed cert:
   - Windows cmd:
     `mkdir certs && openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout certs/privkey.pem -out certs/fullchain.pem -subj "/CN=localhost"`
   - Windows PowerShell:
     `New-Item -ItemType Directory -Force -Path certs; openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout certs/privkey.pem -out certs/fullchain.pem -subj "/CN=localhost"`
   - Linux/Mac/Git Bash:
     `mkdir -p certs && openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout certs/privkey.pem -out certs/fullchain.pem -subj "/CN=localhost"`
   - Note: In Windows cmd, do not use `mkdir -p` because it can create an unintended `-p` folder.
4. Start the stack: `docker compose up -d`

## Uploading Test Images

Before seeding test data with images, you need to upload at least one image to get a media file with ID. The first uploaded image will be assigned ID 1, which the seed script uses.

### Upload an Image

**Prepare a test image:**
- Get any `.jpg`, `.png`, or images file (or create a simple one)
- Save it locally (e.g., `test-image.jpg`)

**Upload via curl:**
```sh
curl -X POST -F "file=@path/to/test-image.jpg" http://localhost:8080/media
```

(Same command for Windows cmd, PowerShell, Linux/Mac)

**Example response:**
```json
{
  "id": 1,
  "filename": "test-image.jpg",
  "contentType": "image/jpeg",
  "fileId": "1,abc123def456",
  "uploadedAt": "2026-04-13T15:30:00Z"
}
```

The image is now stored in SeaweedFS and accessible at `http://localhost:8080/media/1`.

### Before Seeding

1. Upload your test image (gets ID 1)
2. Run the seed command — all 10 seeded events will use this image
3. Visit the frontend and verify all event cards display the image

### Alternative: Use Swagger UI

You can also upload via the interactive API documentation:

1. Open **http://localhost:8080/swagger-ui.html**
2. Find the **POST /media** endpoint (in "Media" section)
3. Click **Try it out**
4. Click **Choose File** and select your image
5. Click **Execute**
6. Note the returned media `id` — use this in seed scripts or manual linking

## Test Data Seeding

For local development and testing, you can seed the database with minimal test data using HTTP endpoints. All seeded records are marked with a `SEED_` prefix for easy identification and cleanup.

### Installing curl

If you don't have curl installed:
- **Windows:** It's built-in on Windows 10+ (use `curl` directly in cmd/PowerShell)
- **Mac:** `brew install curl`
- **Linux:** `sudo apt install curl` (Ubuntu/Debian) or `sudo yum install curl` (RedHat/CentOS)

### Seed Test Data

Insert 2 sample pages, 10 events, 2 places, and 10 media files (all sharing the same image) into your local MySQL database:

```sh
curl -X POST http://localhost:8080/admin/seed
```

(Same command for Windows cmd, PowerShell, Linux/Mac)

**Example response:**
```json
{
  "success": true,
  "message": "Seed data created successfully",
  "pageCount": 2,
  "eventCount": 10,
  "placeCount": 2
}
```

The seeded data includes:
- **Pages:** "Tech Events", "Culture Events"
- **Events:** React Workshop, Spring Boot Masterclass, Docker & Kubernetes, Jazz Night, Art Exhibition, Film Festival, etc.
- **Places:** Copenhagen, Aarhus
- **Images:** All 10 events have cover images from your existing `/media/1` endpoint
- **Relationships:** Events linked to pages and places with realistic dates (7-45 days in future)

### Clear Seeded Data

Remove all test data marked with `SEED_` prefix:

```sh
curl -X DELETE http://localhost:8080/admin/seed
```

(Same command for Windows cmd, PowerShell, Linux/Mac)
```json
{
  "success": true,
  "message": "Seed data cleared successfully",
  "pageCount": 2,
  "eventCount": 10,
  "placeCount": 2
}
```

**Important:** Only records with the `SEED_` prefix are removed, so your production or manually-created data is safe.

### Workflow Example

```sh
# Start the stack
docker compose up -d

# Wait ~40s for services to be healthy

# Seed test data
curl -X POST http://localhost:8080/admin/seed

# Clean up when done
curl -X DELETE http://localhost:8080/admin/seed
```



## Debugging & Logs

### Viewing Application Logs

The application logs are configured with SLF4J/Logback and output to both console and file:

**View logs in real-time from the running container:**
```powershell
docker logs -f unievent-app
```

**View logs for all services:**
```powershell
docker compose logs -f
```

**View log file inside container:**
```powershell
docker exec -it unievent-app cat logs/app.log
```

### Enabling Debug Logging

By default, application logs are at INFO level (production safe). To enable DEBUG logging for development:

**Start the stack with debug profile:**
```powershell
docker compose down
$env:SPRING_PROFILES_ACTIVE = "dev"
docker compose up -d --build
```

**Or on Linux/Mac:**
```bash
docker compose down
SPRING_PROFILES_ACTIVE=dev docker compose up -d --build
```

Debug logging provides additional detail on:
- Database queries and pagination
- API endpoint entry/exit points
- Infrastructure client operations (SeaweedFS, Vault)

Debug output is controlled by `src/main/resources/application-dev.yaml` and is automatically disabled when the dev profile is not active.

### Disabling Debug Logging

To return to INFO-level logging:

**Terminal:**
```powershell
docker compose down
docker compose up -d --build
```

Simply restart without the `SPRING_PROFILES_ACTIVE=dev` variable to return to production-safe INFO-level logging.
