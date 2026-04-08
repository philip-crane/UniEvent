package dk.unievent.app.infrastructure.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import dk.unievent.app.infrastructure.config.SeaweedConfig;

import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.io.IOException;

@Component
public class SeaweedFsClient {

    private final RestClient.Builder restClientBuilder;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public SeaweedFsClient(SeaweedConfig config, RestClient.Builder restClientBuilder, ObjectMapper objectMapper) {
        this.restClientBuilder = restClientBuilder;
        this.restClient = restClientBuilder.baseUrl("http://" + config.getMasterUrl()).build();
        this.objectMapper = objectMapper;
    }

    public FileAssignment assignFile() throws IOException {
        ResponseEntity<String> assignmentResponse;
        try {
            assignmentResponse = restClient.get()
                .uri("/dir/assign")
                .retrieve()
                .toEntity(String.class);
        } catch (RestClientException e) {
            throw new IOException("Failed to get file assignment from SeaweedFS master", e);
        }

        if (assignmentResponse.getStatusCode() != HttpStatus.OK || assignmentResponse.getBody() == null) {
            throw new IOException("Failed to get file assignment from SeaweedFS master");
        }

        JsonNode assignmentNode = objectMapper.readTree(assignmentResponse.getBody());
        String fid = assignmentNode.path("fid").asText(null);
        String publicUrl = assignmentNode.path("publicUrl").asText(null);
        if (fid == null || publicUrl == null) {
            throw new IOException("SeaweedFS assignment response missing fid/publicUrl");
        }

        return new FileAssignment(fid, publicUrl);
    }

    public void uploadFile(String publicUrl, String fid, String filename, byte[] bytes) throws IOException {
        String uploadPath = "/" + fid;

        org.springframework.util.LinkedMultiValueMap<String, Object> body =
            new org.springframework.util.LinkedMultiValueMap<>();
        body.add("file", new org.springframework.core.io.ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        });

        ResponseEntity<String> uploadResponse;
        try {
            RestClient uploadClient = restClientBuilder.baseUrl("http://" + publicUrl).build();
            uploadResponse = uploadClient.post()
                .uri(uploadPath)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .toEntity(String.class);
        } catch (RestClientException e) {
            throw new IOException("Failed to upload file to SeaweedFS volume server", e);
        }

        if (uploadResponse.getStatusCode() != HttpStatus.CREATED && uploadResponse.getStatusCode() != HttpStatus.OK) {
            throw new IOException("Failed to upload file to SeaweedFS volume server");
        }
    }

    public byte[] downloadFile(String fileId) throws IOException {
        ResponseEntity<String> lookupResponse;
        try {
            lookupResponse = restClient.get()
                .uri("/dir/lookup?volumeId={volumeId}", extractVolumeId(fileId))
                .retrieve()
                .toEntity(String.class);
        } catch (RestClientException e) {
            throw new IOException("File not found in SeaweedFS: " + fileId, e);
        }

        if (lookupResponse.getStatusCode() != HttpStatus.OK || lookupResponse.getBody() == null) {
            throw new IOException("File not found in SeaweedFS: " + fileId);
        }

        JsonNode lookupNode = objectMapper.readTree(lookupResponse.getBody());
        JsonNode locations = lookupNode.get("locations");
        if (locations == null || locations.size() == 0) {
            throw new IOException("File location not found in SeaweedFS: " + fileId);
        }

        String volumePublicUrl = locations.get(0).path("publicUrl").asText(null);
        if (volumePublicUrl == null) {
            throw new IOException("Invalid SeaweedFS lookup response for file: " + fileId);
        }

        ResponseEntity<byte[]> downloadResponse;
        try {
            downloadResponse = restClientBuilder
                .baseUrl("http://" + volumePublicUrl)
                .build()
                .get()
                .uri("/" + fileId)
                .retrieve()
                .toEntity(byte[].class);
        } catch (RestClientException e) {
            throw new IOException("Could not read file: " + fileId, e);
        }
        if (downloadResponse.getStatusCode() != HttpStatus.OK || downloadResponse.getBody() == null) {
            throw new IOException("Could not read file: " + fileId);
        }

        return downloadResponse.getBody();
    }

    public void deleteFile(String fileId) throws IOException {
        ResponseEntity<String> lookupResponse;
        try {
            lookupResponse = restClient.get()
                .uri("/dir/lookup?volumeId={volumeId}", extractVolumeId(fileId))
                .retrieve()
                .toEntity(String.class);
        } catch (RestClientException e) {
            throw new IOException("Could not find file to delete: " + fileId, e);
        }

        if (lookupResponse.getStatusCode() != HttpStatus.OK || lookupResponse.getBody() == null) {
            throw new IOException("Could not find file to delete: " + fileId);
        }

        JsonNode lookupNode = objectMapper.readTree(lookupResponse.getBody());
        JsonNode locations = lookupNode.get("locations");
        if (locations == null || locations.size() == 0) {
            throw new IOException("File location not found for delete: " + fileId);
        }

        String volumePublicUrl = locations.get(0).path("publicUrl").asText(null);
        if (volumePublicUrl == null) {
            throw new IOException("Invalid SeaweedFS lookup response for delete: " + fileId);
        }

        try {
            restClientBuilder
                .baseUrl("http://" + volumePublicUrl)
                .build()
                .delete()
                .uri("/" + fileId)
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientException e) {
            throw new IOException("Could not delete file: " + fileId, e);
        }
    }

    private String extractVolumeId(String fid) {
        int commaIndex = fid.indexOf(',');
        return commaIndex > 0 ? fid.substring(0, commaIndex) : fid;
    }

    public record FileAssignment(String fid, String publicUrl) {}
}
