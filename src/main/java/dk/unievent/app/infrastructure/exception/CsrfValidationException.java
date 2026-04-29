package dk.unievent.app.infrastructure.exception;

public class CsrfValidationException extends RuntimeException {

    public CsrfValidationException() {
        super("CSRF token validation failed");
    }
}
