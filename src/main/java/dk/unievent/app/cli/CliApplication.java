package dk.unievent.app.cli;

import dk.unievent.app.cli.command.StatusCommand;
import dk.unievent.app.cli.util.OutputFormatter;
import picocli.CommandLine;
import picocli.CommandLine.Command;

@Command(
    name = "tools",
    description = "UniEvent tools CLI",
    mixinStandardHelpOptions = true,
    subcommands = {
        StatusCommand.class
    }
)
public class CliApplication implements Runnable {

    @Override
    public void run() {
        OutputFormatter.info("Use --help to see available commands.");
    }

    public static void main(String[] args) {
        CommandLine commandLine = new CommandLine(new CliApplication());
        commandLine.setExecutionExceptionHandler((ex, cmd, parse) -> {
            String message = ex.getMessage();
            OutputFormatter.err(message == null ? ex.getClass().getSimpleName() : message);
            return cmd.getCommandSpec().exitCodeOnExecutionException();
        });
        int exitCode = commandLine.execute(args);
        System.exit(exitCode);
    }
}
