package dk.unievent.app.cli.util;

import java.net.URI;

public final class BaseUrlResolver {

    private BaseUrlResolver() {
    }

    public static String resolve(String rawBaseUrl) {
        String candidate = rawBaseUrl == null ? "" : rawBaseUrl.trim();
        if (candidate.isEmpty()) {
            throw new IllegalArgumentException("Base URL cannot be empty");
        }

        URI uri;
        try {
            uri = URI.create(candidate);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid URL format: '" + candidate + "'", ex);
        }

        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            throw new IllegalArgumentException("Unsupported URL scheme '" + scheme + "'. Use http:// or https://");
        }

        if (scheme.equalsIgnoreCase("http") && !isLocalHost(uri.getHost())) {
            throw new IllegalArgumentException("Refusing insecure HTTP for non-localhost target '" + candidate + "'. Use HTTPS.");
        }

        URI base = URI.create(scheme + "://" + uri.getAuthority());
        return base.toString().replaceAll("/$", "");
    }

    static boolean isLocalHost(String host) {
        if (host == null) {
            return false;
        }
        String normalized = host.toLowerCase();
        return normalized.equals("localhost")
            || normalized.equals("127.0.0.1")
            || normalized.equals("::1");
    }
}
