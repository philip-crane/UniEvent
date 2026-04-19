package dk.unievent.app.infrastructure.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import dk.unievent.app.infrastructure.config.VaultConfig;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import lombok.extern.slf4j.Slf4j;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import java.io.InputStream;
import java.net.http.HttpClient;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyStore;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@ConditionalOnProperty(prefix = "unievent.vault", name = "enabled", havingValue = "true")
public class VaultClient {

    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final VaultConfig config;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    private volatile Map<String, String> secretCache = null;
    private volatile Instant cacheExpiry = Instant.EPOCH;

    public VaultClient(VaultConfig config, RestClient.Builder restClientBuilder, ObjectMapper objectMapper) {
        this.config = config;
        this.objectMapper = objectMapper;

        RestClient.Builder builder = restClientBuilder
            .baseUrl(config.getUri())
            .defaultHeader("X-Vault-Token", config.getToken());

        if (config.getCaCertPath() != null && !config.getCaCertPath().isBlank()) {
            try {
                builder = builder.requestFactory(buildTlsRequestFactory(config.getCaCertPath()));
                log.info("Vault TLS configured with CA cert: {}", config.getCaCertPath());
            } catch (Exception e) {
                throw new RuntimeException("Failed to configure Vault TLS from: " + config.getCaCertPath(), e);
            }
        }

        this.restClient = builder.build();
    }

    private JdkClientHttpRequestFactory buildTlsRequestFactory(String caCertPath) throws Exception {
        try (InputStream certStream = Files.newInputStream(Paths.get(caCertPath))) {
            X509Certificate caCert = (X509Certificate) CertificateFactory.getInstance("X.509")
                    .generateCertificate(certStream);

            KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType());
            trustStore.load(null, null);
            trustStore.setCertificateEntry("vault-ca", caCert);

            TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            tmf.init(trustStore);

            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, tmf.getTrustManagers(), null);

            HttpClient httpClient = HttpClient.newBuilder().sslContext(sslContext).build();
            return new JdkClientHttpRequestFactory(httpClient);
        }
    }

    public Map<String, String> readSecretData() {
        log.debug("Accessing Vault");
        try {
            ResponseEntity<String> response = restClient.get()
                .uri("/v1/" + config.getSecretPath())
                .retrieve()
                .toEntity(String.class);

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                log.warn("Invalid response from Vault: status={}", response.getStatusCode());
                return Collections.emptyMap();
            }

            JsonNode data = objectMapper.readTree(response.getBody()).path("data").path("data");
            if (data.isMissingNode()) {
                log.warn("No secret data found in Vault response");
                return Collections.emptyMap();
            }

            Map<String, String> secrets = new HashMap<>();
            data.properties().forEach(e -> secrets.put(e.getKey(), e.getValue().asText()));
            log.info("Successfully read {} secrets from Vault", secrets.size());
            return secrets;
        } catch (RestClientResponseException e) {
            log.error("Failed to read secrets from Vault: {} (status: {})", config.getUri(), e.getStatusCode(), e);
            throw new RuntimeException(
                "Failed to read secrets from Vault: " + config.getUri() + " (status: " + e.getStatusCode() + ")",
                e
            );
        } catch (Exception e) {
            log.error("Failed to read secrets from Vault: {}", config.getUri(), e);
            throw new RuntimeException("Failed to read secrets from Vault: " + config.getUri(), e);
        }
    }

    public synchronized String readSecretValue(String key) {
        if (secretCache == null || Instant.now().isAfter(cacheExpiry)) {
            secretCache = readSecretData();
            cacheExpiry = Instant.now().plus(CACHE_TTL);
            log.debug("Vault secret cache refreshed, expires at {}", cacheExpiry);
        }
        return secretCache.getOrDefault(key, null);
    }
}
