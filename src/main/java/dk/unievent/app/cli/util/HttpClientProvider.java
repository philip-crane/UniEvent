package dk.unievent.app.cli.util;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;

public final class HttpClientProvider {

    private HttpClientProvider() {
    }

    public static HttpClient create(String baseUrl) {
        URI uri = URI.create(baseUrl);
        if ("https".equalsIgnoreCase(uri.getScheme()) && BaseUrlResolver.isLocalHost(uri.getHost())) {
            return createInsecureLocalClient();
        }
        return HttpClient.newHttpClient();
    }

    private static HttpClient createInsecureLocalClient() {
        try {
            TrustManager[] trustManagers = new TrustManager[]{new X509TrustManager() {
                @Override
                public void checkClientTrusted(X509Certificate[] chain, String authType) {
                }

                @Override
                public void checkServerTrusted(X509Certificate[] chain, String authType) {
                }

                @Override
                public X509Certificate[] getAcceptedIssuers() {
                    return new X509Certificate[0];
                }
            }};

            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustManagers, new SecureRandom());

            return HttpClient.newBuilder()
                .sslContext(sslContext)
                .build();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to create local HTTPS client", e);
        }
    }
}
