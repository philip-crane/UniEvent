package dk.unievent.app.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Facebook place/location data nested within events
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FbPlaceData {
    
    private String name;
    
    private String street;
    
    private String city;
    
    private String zip;
    
    private String country;
}
