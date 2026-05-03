package dk.unievent.app.application.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.UUID;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CsrfTokenServiceTests {

    private static final String CSRF_SECRET = "test-csrf-secret-1234567890";
    private static final Pattern TOKEN_PATTERN = Pattern.compile(
            "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{64}$"
    );

    private final CsrfTokenService csrfTokenService = new CsrfTokenService(CSRF_SECRET);

    @Test
    void generateTokenShouldReturnUuidSignatureFormat() {
        String token = csrfTokenService.generateToken();

        assertNotNull(token);
        assertTrue(TOKEN_PATTERN.matcher(token).matches());

        TokenComponents components = extractComponents(token);
        assertDoesNotThrow(() -> UUID.fromString(components.nonce()));
        assertEquals(36, components.nonce().length());
        assertEquals(64, components.signature().length());
        assertTrue(components.signature().matches("[0-9a-f]{64}"));
    }

    @Test
    void validateTokenShouldReturnTrueForMatchingToken() {
        String token = csrfTokenService.generateToken();

        assertTrue(csrfTokenService.validateToken(token, token));
        assertTrue(csrfTokenService.isTokenValid(token, token));
    }

    @Test
    void validateTokenShouldReturnFalseForDifferentTokens() {
        String token = csrfTokenService.generateToken();
        String otherToken = csrfTokenService.generateToken();

        assertNotEquals(token, otherToken);
        assertFalse(csrfTokenService.validateToken(token, otherToken));
        assertFalse(csrfTokenService.validateToken(otherToken, token));
    }

    @Test
    void constantTimeComparisonShouldBeConsistentForEqualAndDifferentInputs() throws Exception {
        String token = csrfTokenService.generateToken();
        String prefixTampered = mutateCharacter(token, 0);
        String suffixTampered = mutateCharacter(token, token.length() - 1);

        assertTrue(invokeConstantTimeEquals(token, token));
        assertFalse(invokeConstantTimeEquals(token, prefixTampered));
        assertFalse(invokeConstantTimeEquals(token, suffixTampered));
        assertFalse(invokeConstantTimeEquals(token, token.substring(0, token.length() - 1)));

        assertFalse(csrfTokenService.validateToken(prefixTampered, prefixTampered));
        assertFalse(csrfTokenService.validateToken(suffixTampered, suffixTampered));
    }

    @Test
    void validateTokenShouldReturnFalseForEmptyTokens() {
        String token = csrfTokenService.generateToken();

        assertFalse(csrfTokenService.validateToken("", token));
        assertFalse(csrfTokenService.validateToken(" ", token));
        assertFalse(csrfTokenService.validateToken(token, ""));
        assertFalse(csrfTokenService.validateToken(token, " "));
        assertFalse(csrfTokenService.validateToken("", ""));
        assertFalse(csrfTokenService.validateToken(" ", " "));
    }

    @Test
    void validateTokenShouldReturnFalseForNullTokens() {
        String token = csrfTokenService.generateToken();

        assertFalse(csrfTokenService.validateToken(null, token));
        assertFalse(csrfTokenService.validateToken(token, null));
        assertFalse(csrfTokenService.validateToken(null, null));
    }

    @Test
    void tokenComponentExtractionShouldUseFinalHyphenDelimiter() {
        String token = csrfTokenService.generateToken();
        TokenComponents components = extractComponents(token);

        assertEquals(token.lastIndexOf('-'), token.indexOf(components.signature()) - 1);
        assertEquals(36, components.nonce().length());
        assertEquals(4, components.nonce().chars().filter(character -> character == '-').count());
        assertDoesNotThrow(() -> UUID.fromString(components.nonce()));
        assertEquals(expectedSignature(components.nonce()), components.signature());
        assertTrue(csrfTokenService.validateToken(token, token));
    }

    @Test
    void hmacSignatureVerificationShouldRejectTamperedTokens() {
        String token = csrfTokenService.generateToken();
        TokenComponents components = extractComponents(token);
        String expectedSignature = expectedSignature(components.nonce());

        assertEquals(expectedSignature, components.signature());
        assertTrue(csrfTokenService.validateToken(token, token));

        String tamperedSignature = mutateCharacter(components.signature(), components.signature().length() - 1);
        String tokenWithTamperedSignature = components.nonce() + "-" + tamperedSignature;
        assertFalse(csrfTokenService.validateToken(tokenWithTamperedSignature, tokenWithTamperedSignature));

        String tokenWithInvalidNonce = "not-a-uuid-" + components.signature();
        assertFalse(csrfTokenService.validateToken(tokenWithInvalidNonce, tokenWithInvalidNonce));
    }

    private static TokenComponents extractComponents(String token) {
        int delimiter = token.lastIndexOf('-');
        assertTrue(delimiter > 0);
        assertTrue(delimiter < token.length() - 1);
        return new TokenComponents(token.substring(0, delimiter), token.substring(delimiter + 1));
    }

    private static String expectedSignature(String nonce) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(CSRF_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(nonce.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to compute expected CSRF signature", ex);
        }
    }

    private boolean invokeConstantTimeEquals(String left, String right) throws Exception {
        Method method = CsrfTokenService.class.getDeclaredMethod("constantTimeEquals", String.class, String.class);
        method.setAccessible(true);
        return (boolean) method.invoke(csrfTokenService, left, right);
    }

    private static String mutateCharacter(String value, int index) {
        char current = value.charAt(index);
        char replacement = current == 'a' ? 'b' : 'a';
        return value.substring(0, index) + replacement + value.substring(index + 1);
    }

    private record TokenComponents(String nonce, String signature) {
    }
}
