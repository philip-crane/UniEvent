package dk.unievent.app.infrastructure.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ExceptionTests {

    @Test
    void csrfValidationExceptionShouldHaveFixedMessage() {
        CsrfValidationException ex = new CsrfValidationException();

        assertEquals("CSRF token validation failed", ex.getMessage());
        assertInstanceOf(RuntimeException.class, ex);
    }

    @Test
    void emailAlreadyRegisteredExceptionShouldHaveFixedMessage() {
        EmailAlreadyRegisteredException ex = new EmailAlreadyRegisteredException();

        assertEquals("Email is already registered", ex.getMessage());
    }

    @Test
    void facebookApiExceptionShouldExposeStatusCodeAndType() {
        FacebookApiException ex = new FacebookApiException("Token expired", 401, "OAuthException");

        assertEquals("Token expired", ex.getMessage());
        assertEquals(401, ex.getStatusCode());
        assertEquals("OAuthException", ex.getErrorType());
    }

    @Test
    void facebookApiExceptionWithCauseShouldChain() {
        Throwable cause = new RuntimeException("network");
        FacebookApiException ex = new FacebookApiException("Wrapped", 500, "ServerError", cause);

        assertSame(cause, ex.getCause());
        assertEquals(500, ex.getStatusCode());
    }

    @Test
    void facebookApiExceptionToStringShouldIncludeFields() {
        FacebookApiException ex = new FacebookApiException("Fail", 429, "APIError");

        String s = ex.toString();
        assertTrue(s.contains("429"));
        assertTrue(s.contains("APIError"));
        assertTrue(s.contains("Fail"));
    }

    @Test
    void invalidConfirmationTokenExceptionShouldHaveFixedMessage() {
        InvalidConfirmationTokenException ex = new InvalidConfirmationTokenException();

        assertEquals("Invalid or expired confirmation token", ex.getMessage());
    }

    @Test
    void organizerKeyAlreadyUsedExceptionShouldHaveFixedMessage() {
        OrganizerKeyAlreadyUsedException ex = new OrganizerKeyAlreadyUsedException();

        assertEquals("Organizer key has already been used", ex.getMessage());
    }

    @Test
    void organizerKeyExpiredExceptionShouldHaveFixedMessage() {
        OrganizerKeyExpiredException ex = new OrganizerKeyExpiredException();

        assertEquals("Organizer key has expired", ex.getMessage());
    }

    @Test
    void organizerKeyNotFoundExceptionShouldHaveFixedMessage() {
        OrganizerKeyNotFoundException ex = new OrganizerKeyNotFoundException();

        assertEquals("Organizer key not found", ex.getMessage());
    }

    @Test
    void tokenCompromisedExceptionShouldHaveFixedMessage() {
        TokenCompromisedException ex = new TokenCompromisedException();

        assertEquals("Refresh token family compromised", ex.getMessage());
    }

    @Test
    void unauthorizedTokenExceptionShouldAcceptMessage() {
        UnauthorizedTokenException ex = new UnauthorizedTokenException("Token not yours");

        assertEquals("Token not yours", ex.getMessage());
        assertInstanceOf(RuntimeException.class, ex);
    }

    @Test
    void usernameAlreadyTakenExceptionShouldHaveFixedMessage() {
        UsernameAlreadyTakenException ex = new UsernameAlreadyTakenException();

        assertEquals("Username is already taken", ex.getMessage());
    }
}
