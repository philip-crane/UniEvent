package dk.unievent.app.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Facebook event cover image data
 * Contains URL to the event's cover/thumbnail image
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FbCoverData {
    
    private String id;
    
    private String source;
    
    private Integer height;
    
    private Integer width;
    
    @JsonProperty("offset_x")
    private Integer offsetX;
    
    @JsonProperty("offset_y")
    private Integer offsetY;
}
