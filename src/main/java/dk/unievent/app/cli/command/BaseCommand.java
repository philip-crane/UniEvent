package dk.unievent.app.cli.command;

import dk.unievent.app.cli.util.OutputFormatter;
import dk.unievent.app.cli.util.SensitiveDataRedactor;

import java.util.concurrent.Callable;

public abstract class BaseCommand implements Callable<Integer> {

    protected void info(String message) {
        OutputFormatter.info(message);
    }

    protected void ok(String message) {
        OutputFormatter.ok(message);
    }

    protected void warn(String message) {
        OutputFormatter.warn(message);
    }

    protected void err(String message) {
        OutputFormatter.err(message);
    }

    protected void step(String message) {
        OutputFormatter.step(message);
    }

    protected void sep() {
        OutputFormatter.sep();
    }

    protected String redact(String text) {
        return SensitiveDataRedactor.redact(text);
    }

    protected int success() {
        return 0;
    }

    protected int failure() {
        return 1;
    }
}
