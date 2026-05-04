package dk.unievent.app.cli.util;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class CliEnvironment {

    private static Path cachedRepoRoot;

    private CliEnvironment() {
    }

    public static Path getRepoRoot() {
        if (cachedRepoRoot != null) {
            return cachedRepoRoot;
        }

        Path dir = Paths.get(System.getProperty("user.dir")).toAbsolutePath();
        while (dir != null) {
            if (Files.exists(dir.resolve(".git")) || Files.exists(dir.resolve("pom.xml"))) {
                cachedRepoRoot = dir;
                return cachedRepoRoot;
            }
            dir = dir.getParent();
        }

        throw new IllegalStateException("Could not find repo root (no .git or pom.xml)");
    }

    public static Map<String, String> loadDotEnv() {
        Path envFile = getRepoRoot().resolve(".env");
        if (!Files.exists(envFile)) {
            throw new IllegalStateException(".env file not found");
        }

        Map<String, String> vars = new HashMap<>();
        List<String> lines;
        try {
            lines = Files.readAllLines(envFile, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read .env file", e);
        }

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                continue;
            }
            int idx = trimmed.indexOf('=');
            if (idx <= 0) {
                continue;
            }
            String key = trimmed.substring(0, idx).trim();
            String value = trimmed.substring(idx + 1).trim();
            value = unquote(value);
            vars.put(key, value);
        }

        return vars;
    }

    private static String unquote(String value) {
        if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }
}
