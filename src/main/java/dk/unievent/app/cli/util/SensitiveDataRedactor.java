package dk.unievent.app.cli.util;

import java.util.List;
import java.util.regex.Pattern;

public final class SensitiveDataRedactor {

    private record Rule(Pattern pattern, String replacement) {
    }

    private static final List<Rule> RULES = List.of(
        new Rule(Pattern.compile("(?im)((?:token|password|secret|authorization|client_secret|access_token|refresh_token)\\s*[:=]\\s*)([^\\s,;]+)"),
            "$1***REDACTED***"),
        new Rule(Pattern.compile("(?im)(\"(?:token|password|secret|authorization|client_secret|access_token|refresh_token)\"\\s*:\\s*\")([^\"]+)(\")"),
            "$1***REDACTED***$3"),
        new Rule(Pattern.compile("(?im)(Bearer\\s+)([A-Za-z0-9\\-\\._~\\+/=]+)"),
            "$1***REDACTED***"),
        new Rule(Pattern.compile("(?im)((?:VAULT_TOKEN|VAULT_ROOT_TOKEN|VAULT_UNSEAL_TOKEN|confirmationToken|inviteKey|invitationKey)\\s*[:=]\\s*)([^\\s,;]+)"),
            "$1***REDACTED***"),
        new Rule(Pattern.compile("(?im)(\"(?:confirmationToken|inviteKey|invitationKey)\"\\s*:\\s*\")([^\"]+)(\")"),
            "$1***REDACTED***$3")
    );

    private SensitiveDataRedactor() {
    }

    public static String redact(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }

        String redacted = text;
        for (Rule rule : RULES) {
            redacted = rule.pattern().matcher(redacted).replaceAll(rule.replacement());
        }
        return redacted;
    }
}
