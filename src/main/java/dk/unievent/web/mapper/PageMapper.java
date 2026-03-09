package dk.unievent.web.mapper;

import dk.unievent.web.dto.PageDTO;
import dk.unievent.web.model.PageEntity;
import org.springframework.stereotype.Component;

@Component
public class PageMapper {
    
    public PageDTO toDTO(PageEntity entity) {
        if (entity == null) {
            return null;
        }
        
        PageDTO dto = new PageDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setPictureUrl(entity.getPictureUrl());
        
        // Computed fields
        dto.setUrl("https://facebook.com/" + entity.getId());
        dto.setActive(isPageActive(entity));
        
        return dto;
    }
    
    public PageEntity toEntity(PageDTO dto) {
        if (dto == null) {
            return null;
        }
        
        PageEntity entity = new PageEntity();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setPictureUrl(dto.getPictureUrl());
        
        return entity;
    }
    
    /**
     * A page is active if its token status is "valid" and not expired
     */
    private Boolean isPageActive(PageEntity entity) {
        if (entity == null) {
            return false;
        }
        return "valid".equals(entity.getTokenStatus());
    }
}
