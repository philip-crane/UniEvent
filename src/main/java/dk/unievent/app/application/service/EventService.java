package dk.unievent.app.application.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import dk.unievent.app.application.dto.EventDTO;
import dk.unievent.app.application.mapper.EventMapper;
import dk.unievent.app.application.mapper.PlaceMapper;
import dk.unievent.app.db.model.EventEntity;
import dk.unievent.app.db.model.MediaEntity;
import dk.unievent.app.db.model.PageEntity;
import dk.unievent.app.db.repository.EventRepository;
import dk.unievent.app.db.repository.MediaRepository;
import dk.unievent.app.db.repository.PageRepository;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;
    private final PlaceMapper placeMapper;
    private final MediaRepository mediaRepository;
    private final PageRepository pageRepository;
    private final MediaService mediaService;

    public EventService(
            EventRepository eventRepository,
            EventMapper eventMapper,
            PlaceMapper placeMapper,
            MediaRepository mediaRepository,
            PageRepository pageRepository,
            MediaService mediaService) {
        this.eventRepository = eventRepository;
        this.eventMapper = eventMapper;
        this.placeMapper = placeMapper;
        this.mediaRepository = mediaRepository;
        this.pageRepository = pageRepository;
        this.mediaService = mediaService;
    }

    public Page<EventDTO> getAllEvents(Pageable pageable) {
        return eventRepository.findAllByOrderByStartTimeAsc(pageable)
                .map(eventMapper::toDTO);
    }

    public Page<EventDTO> getFutureEvents(Pageable pageable) {
        return eventRepository.findByStartTimeGreaterThanEqualOrderByStartTimeAsc(LocalDateTime.now(), pageable)
                .map(eventMapper::toDTO);
    }

    public EventDTO getEventById(String id) {
        Optional<EventEntity> entity = eventRepository.findById(id);
        return entity.map(eventMapper::toDTO).orElse(null);
    }

    public Page<EventDTO> getEventsByPageId(String pageId, Pageable pageable) {
        return eventRepository.findByPageIdOrderByStartTimeAsc(pageId, pageable)
                .map(eventMapper::toDTO);
    }

    public Page<EventDTO> getFutureEventsByPageId(String pageId, Pageable pageable) {
        return eventRepository.findByPageIdAndStartTimeGreaterThanEqualOrderByStartTimeAsc(pageId, LocalDateTime.now(), pageable)
                .map(eventMapper::toDTO);
    }

    public Page<EventDTO> getEventsByPlaceId(String placeId, Pageable pageable) {
        return eventRepository.findByPlaceIdOrderByStartTimeAsc(placeId, pageable)
                .map(eventMapper::toDTO);
    }

    public EventDTO createEvent(EventDTO eventDTO) {
        EventEntity entity = eventMapper.toEntity(eventDTO);

        if (eventDTO.getPageId() != null) {
            entity.setPage(getPageOrThrow(eventDTO.getPageId()));
        }

        if (eventDTO.getCoverImageId() != null) {
            MediaEntity coverImage = mediaRepository.findById(eventDTO.getCoverImageId()).orElse(null);
            entity.setCoverImage(coverImage);
        }

        EventEntity saved = eventRepository.save(entity);
        return eventMapper.toDTO(saved);
    }

    public EventDTO updateEvent(String id, EventDTO eventDTO) {
        Optional<EventEntity> existing = eventRepository.findById(id);
        if (existing.isEmpty()) {
            return null;
        }

        EventEntity entity = existing.get();
        entity.setTitle(eventDTO.getTitle());
        entity.setDescription(eventDTO.getDescription());
        entity.setStartTime(eventDTO.getStartTime());
        entity.setEndTime(eventDTO.getEndTime());
        entity.setEventUrl(eventDTO.getEventUrl());

        if (eventDTO.getPlace() != null) {
            entity.setPlace(placeMapper.toEntity(eventDTO.getPlace()));
        }

        if (eventDTO.getPageId() != null) {
            entity.setPage(getPageOrThrow(eventDTO.getPageId()));
        }

        if (eventDTO.getCoverImageId() != null) {
            MediaEntity coverImage = mediaRepository.findById(eventDTO.getCoverImageId()).orElse(null);
            entity.setCoverImage(coverImage);
        }

        EventEntity updated = eventRepository.save(entity);
        return eventMapper.toDTO(updated);
    }

    public EventDTO uploadCoverImage(String id, MultipartFile file) throws IOException {
        Optional<EventEntity> existing = eventRepository.findById(id);
        if (existing.isEmpty()) {
            return null;
        }

        String storedFilename = mediaService.store(file);
        MediaEntity mediaEntity = MediaEntity.builder()
                .filename(file.getOriginalFilename())
                .contentType(file.getContentType())
                .fileId(storedFilename)
                .uploadedAt(Instant.now())
                .build();
        MediaEntity savedMedia = mediaRepository.save(mediaEntity);

        EventEntity entity = existing.get();
        entity.setCoverImage(savedMedia);
        EventEntity updated = eventRepository.save(entity);
        return eventMapper.toDTO(updated);
    }

    public boolean deleteEvent(String id) {
        if (eventRepository.existsById(id)) {
            eventRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private PageEntity getPageOrThrow(String pageId) {
        return pageRepository.findById(pageId)
                .orElseThrow(() -> new NoSuchElementException("Page not found: " + pageId));
    }
}
