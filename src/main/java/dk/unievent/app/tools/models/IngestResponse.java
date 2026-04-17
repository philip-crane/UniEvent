package dk.unievent.app.tools.models;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class IngestResponse {
    private final String pageId;
    private final int eventCount;
    private final List<String> eventTitles;
}
