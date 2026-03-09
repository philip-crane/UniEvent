package dk.unievent.web.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LocationDTO {
    private String street;
    private String city;
    private String zip;
    private String country;
    private Double latitude;
    private Double longitude;
}
