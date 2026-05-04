package dk.unievent.app.cli.util;

import picocli.CommandLine;

public final class OutputFormatter {

    private static final CommandLine.Help.Ansi ANSI = CommandLine.Help.Ansi.AUTO;

    private OutputFormatter() {
    }

    public static void info(String message) {
        print("cyan", message);
    }

    public static void ok(String message) {
        print("green", message);
    }

    public static void warn(String message) {
        print("yellow", message);
    }

    public static void err(String message) {
        print("red", message);
    }

    public static void step(String message) {
        System.out.println();
        print("white", message);
    }

    public static void sep() {
        System.out.println("-".repeat(50));
    }

    private static void print(String color, String message) {
        String safeMessage = message == null ? "" : message;
        System.out.println(ANSI.string("@|" + color + "  " + safeMessage + "|@"));
    }
}
