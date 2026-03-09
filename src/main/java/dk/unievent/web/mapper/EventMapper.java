package dk.unievent.web.mapper;

import dk.unievent.web.dto.EventDTO;
import dk.unievent.web.model.EventEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class EventMapper {
    
    @Autowired
    private PlaceMapper placeMapper;
    
    public EventDTO toDTO(EventEntity entity) {
        if (entity == null) {
            return null;
        }
        
        EventDTO dto = new EventDTO();
        dto.setId(entity.getId());
        dto.setPageId(entity.getPage() != null ? entity.getPage().getId() : null);
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setStartTime(entity.getStartTime());
        dto.setEndTime(entity.getEndTime());
        dto.setPlace(placeMapper.toDTO(entity.getPlace()));
        dto.setCoverImageUrl(entity.getCoverImageUrl());
        dto.setEventURL(entity.getEventURL());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        
        return dto;
    }
    
    public EventEntity toEntity(EventDTO dto) {
        if (dto == null) {
            return null;
        }
        
        EventEntity entity = new EventEntity();
        entity.setId(dto.getId());
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setStartTime(dto.getStartTime());
        entity.setEndTime(dto.getEndTime());
        entity.setPlace(placeMapper.toEntity(dto.getPlace()));
        entity.setCoverImageUrl(dto.getCoverImageUrl());
        entity.setEventURL(dto.getEventURL());
        
        return entity;
    }
}
