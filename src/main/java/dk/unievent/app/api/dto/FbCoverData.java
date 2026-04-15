package dk.unievent.app.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Facebook event cover image data
 * Contains URL to the event's cover/thumbnail image
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FbCoverData {
    
    private String source;
    
    private Integer height;
    
    private Integer width;
    
    @JsonProperty("cover_offset_x")
    private Integer offsetX;
    
    @JsonProperty("cover_offset_y")
    private Integer offsetY;
}
