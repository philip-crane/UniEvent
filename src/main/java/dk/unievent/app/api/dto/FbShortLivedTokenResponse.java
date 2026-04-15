package dk.unievent.app.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Facebook OAuth short-lived access token response
 * Exchanged for long-lived token within hours
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FbShortLivedTokenResponse {
    
    @JsonProperty("access_token")
    private String accessToken;
    
    @JsonProperty("token_type")
    private String tokenType;
    
    @JsonProperty("expires_in")
    private Integer expiresIn;
}
