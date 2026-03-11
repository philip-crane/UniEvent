# UniEventServer

Migration Strategy Checklist:

Backend:
- [ ] Define endpoints
- [ ] DB Setup (SQL)
- [x] Media (filesystem storage with DB metadata)

## Media handling

The server stores uploaded files on disk (or in a mounted volume) and keeps a reference in MySQL.  The following REST endpoints are available:

- `POST /media` – multipart upload parameter `file`. Returns JSON metadata including `id`.
- `GET /media/{id}` – download the file as an attachment.
- `GET /media` – list all media records.

Docker compose now mounts a `media-data` volume at `/app/media` inside the container.  The storage location is configurable via `unievent.media.location` (environment variable `UNIEVENT_MEDIA_LOCATION`).
- [ ] Serverless Funtions
- [ ] Secret Manager
- [ ] Hosting / Debian Server

Frontend:
- [ ] Security update
- [ ] New DAL
- [ ] Auth/User function
- [ ] Calendar function