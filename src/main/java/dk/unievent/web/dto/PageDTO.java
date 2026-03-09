package dk.unievent.web.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Data Transfer Object for Pages - what the frontend receives
 * Only exposes public-facing information, hides all internal token/refresh tracking
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PageDTO {
    private String id;
    private String name;
    private String url;          // computed: https://facebook.com/{id}
    private Boolean active;      // computed: tokenStatus == "valid"
    private String pictureUrl;
}
