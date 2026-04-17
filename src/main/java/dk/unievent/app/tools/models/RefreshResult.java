package dk.unievent.app.tools.models;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RefreshResult {
    private final String pageId;
    private final boolean success;
    private final String message;
}
