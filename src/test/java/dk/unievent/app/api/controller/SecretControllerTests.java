package dk.unievent.app.api.controller;

import dk.unievent.app.application.dto.SecretDTO;
import dk.unievent.app.application.service.VaultService;
import dk.unievent.app.api.handler.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SecretControllerTests {

    @Mock
    private VaultService vaultService;

    @InjectMocks
    private SecretController secretController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(secretController)
            .setControllerAdvice(new GlobalExceptionHandler())
            .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
            .build();
    }

    @Test
    void getAllSecretsShouldReturnList() throws Exception {
        SecretDTO secret = secretDto(1L, "facebook_page_p1", "facebook_page_token");
        when(vaultService.getAllSecrets()).thenReturn(List.of(secret));

        mockMvc.perform(get("/api/admin/secrets"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].name").value("facebook_page_p1"));
    }

    @Test
    void getSecretByIdShouldReturn200WhenFound() throws Exception {
        SecretDTO secret = secretDto(5L, "facebook_page_p5", "facebook_page_token");
        when(vaultService.getSecretById(5L)).thenReturn(Optional.of(secret));

        mockMvc.perform(get("/api/admin/secrets/5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(5))
            .andExpect(jsonPath("$.name").value("facebook_page_p5"));
    }

    @Test
    void getSecretByIdShouldReturn404WhenNotFound() throws Exception {
        when(vaultService.getSecretById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/admin/secrets/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void getSecretByNameShouldReturn200WhenFound() throws Exception {
        SecretDTO secret = secretDto(3L, "facebook_page_abc", "facebook_page_token");
        when(vaultService.getSecretByName("facebook_page_abc")).thenReturn(Optional.of(secret));

        mockMvc.perform(get("/api/admin/secrets/by-name/facebook_page_abc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("facebook_page_abc"));
    }

    @Test
    void getSecretByNameShouldReturn404WhenNotFound() throws Exception {
        when(vaultService.getSecretByName("missing")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/admin/secrets/by-name/missing"))
            .andExpect(status().isNotFound());
    }

    @Test
    void getSecretsByTypeShouldReturnPage() throws Exception {
        SecretDTO secret = secretDto(1L, "facebook_page_p1", "facebook_page_token");
        when(vaultService.getSecretsByType(eq("facebook_page_token"), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(secret), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/admin/secrets/by-type/facebook_page_token").param("page", "0").param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].secretType").value("facebook_page_token"));

        verify(vaultService).getSecretsByType(eq("facebook_page_token"), any(Pageable.class));
    }

    @Test
    void getSecretsByStatusShouldReturnPage() throws Exception {
        SecretDTO secret = secretDto(1L, "facebook_page_p1", "facebook_page_token");
        secret.setStatus("active");
        when(vaultService.getSecretsByStatus(eq("active"), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(secret), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/admin/secrets/by-status/active").param("page", "0").param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].status").value("active"));
    }

    @Test
    void deleteSecretShouldReturn204WhenDeleted() throws Exception {
        when(vaultService.deleteSecret(7L)).thenReturn(true);

        mockMvc.perform(delete("/api/admin/secrets/7"))
            .andExpect(status().isNoContent());
    }

    @Test
    void deleteSecretShouldReturn404WhenNotFound() throws Exception {
        when(vaultService.deleteSecret(404L)).thenReturn(false);

        mockMvc.perform(delete("/api/admin/secrets/404"))
            .andExpect(status().isNotFound());
    }

    private SecretDTO secretDto(Long id, String name, String secretType) {
        SecretDTO dto = new SecretDTO();
        dto.setId(id);
        dto.setName(name);
        dto.setSecretType(secretType);
        dto.setVaultPath("secret/data/unievent/facebook/page_" + name);
        dto.setStatus("active");
        return dto;
    }
}
