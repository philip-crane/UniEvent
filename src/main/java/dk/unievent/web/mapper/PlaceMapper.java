package dk.unievent.web.mapper;

import dk.unievent.web.dto.LocationDTO;
import dk.unievent.web.dto.PlaceDTO;
import dk.unievent.web.model.PlaceEntity;
import org.springframework.stereotype.Component;

@Component
public class PlaceMapper {
    
    public PlaceDTO toDTO(PlaceEntity entity) {
        if (entity == null) {
            return null;
        }
        
        PlaceDTO dto = new PlaceDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setLocation(toLocationDTO(entity));
        
        return dto;
    }
    
    private LocationDTO toLocationDTO(PlaceEntity entity) {
        LocationDTO location = new LocationDTO();
        location.setStreet(entity.getStreet());
        location.setCity(entity.getCity());
        location.setZip(entity.getZip());
        location.setCountry(entity.getCountry());
        location.setLatitude(entity.getLatitude());
        location.setLongitude(entity.getLongitude());
        
        return location;
    }
    
    public PlaceEntity toEntity(PlaceDTO dto) {
        if (dto == null) {
            return null;
        }
        
        PlaceEntity entity = new PlaceEntity();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        
        if (dto.getLocation() != null) {
            entity.setStreet(dto.getLocation().getStreet());
            entity.setCity(dto.getLocation().getCity());
            entity.setZip(dto.getLocation().getZip());
            entity.setCountry(dto.getLocation().getCountry());
            entity.setLatitude(dto.getLocation().getLatitude());
            entity.setLongitude(dto.getLocation().getLongitude());
        }
        
        return entity;
    }
}
