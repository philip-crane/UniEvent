package dk.unievent.app.cli.command;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dk.unievent.app.cli.util.CliEnvironment;
import dk.unievent.app.cli.util.CommandResult;
import dk.unievent.app.cli.util.CommandRunner;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;

@Command(
    name = "status",
    description = "Show Docker stack and Vault health",
    mixinStandardHelpOptions = true
)
public class StatusCommand extends BaseCommand {

    @Option(names = {"-v", "--verbose"}, description = "Show extra output")
    private boolean verboseOutput;

    @Override
    public Integer call() {
        Path repoRoot = CliEnvironment.getRepoRoot();
        if (!checkDockerDaemon(repoRoot)) {
            return failure();
        }

        info("Docker daemon is running");

        CommandResult stackPs = runDockerComposePs(repoRoot);
        if (stackPs.exitCode() != 0) {
            warn("Could not query compose stack");
            if (!stackPs.output().isEmpty()) {
                warn(String.join(" | ", stackPs.output()));
            }
            return success();
        }

        if (verboseOutput) {
            info("docker compose ps:");
            for (String line : stackPs.output()) {
                System.out.println(line);
            }
        }

        String vaultStatus = getVaultStatus(repoRoot);
        info("Vault: " + vaultStatus);

        checkContainerHealth(stackPs.output(), "unievent-app", "App container");
        checkContainerHealth(stackPs.output(), "unievent-frontend", "Frontend container");

        return success();
    }

    private boolean checkDockerDaemon(Path repoRoot) {
        try {
            CommandResult result = CommandRunner.run(List.of("docker", "info"), repoRoot);
            if (result.exitCode() == 0) {
                return true;
            }
        } catch (IOException e) {
            err("Docker not found");
            warn("Install Docker Desktop from https://www.docker.com/products/docker-desktop");
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            err("Docker check interrupted");
            return false;
        }

        err("Docker is installed, but the Docker daemon is not running");
        warn("Start Docker Desktop (or your Docker service), then re-run this command");
        warn("Quick check: docker info");
        return false;
    }

    private CommandResult runDockerComposePs(Path repoRoot) {
        try {
            return CommandRunner.run(List.of("docker", "compose", "ps"), repoRoot);
        } catch (IOException e) {
            return new CommandResult(1, List.of("docker compose failed: " + e.getMessage()));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new CommandResult(1, List.of("docker compose interrupted"));
        }
    }

    private String getVaultStatus(Path repoRoot) {
        CommandResult result;
        try {
            result = CommandRunner.run(List.of("docker", "compose", "exec", "-T", "vault", "vault", "status", "-format=json"), repoRoot);
        } catch (IOException e) {
            return "unavailable";
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "unavailable";
        }

        if (result.exitCode() != 0 && result.exitCode() != 2) {
            return "unavailable";
        }

        String payload = String.join("\n", result.output()).trim();
        if (payload.isEmpty()) {
            return "unavailable";
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(payload);
            boolean initialized = node.path("initialized").asBoolean(false);
            if (!initialized) {
                return "not-initialized";
            }
            boolean sealed = node.path("sealed").asBoolean(true);
            if (sealed) {
                return "sealed";
            }
            return "ready";
        } catch (IOException e) {
            return "unavailable";
        }
    }

    private void checkContainerHealth(List<String> lines, String match, String label) {
        String line = lines.stream()
            .filter(item -> item.toLowerCase(Locale.ROOT).contains(match))
            .findFirst()
            .orElse(null);

        if (line == null) {
            warn(label + " not found in compose output");
            return;
        }

        if (line.contains("(healthy)")) {
            ok(label + " is healthy");
        } else if (line.contains("(unhealthy)")) {
            warn(label + " is unhealthy");
        } else {
            warn(label + " is starting or unknown");
        }
    }
}
