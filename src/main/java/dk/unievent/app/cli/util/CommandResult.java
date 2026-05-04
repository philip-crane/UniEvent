package dk.unievent.app.cli.util;

import java.util.List;

public record CommandResult(int exitCode, List<String> output) {
}
