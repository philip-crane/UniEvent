package dk.unievent.app.infrastructure.exception;

/**
 * Exception thrown when a Facebook Graph API call fails.
 * Contains HTTP status code and Facebook error type for debugging.
 */
public class FacebookApiException extends RuntimeException {

    private final int statusCode;
    private final String errorType;

    /**
     * Create a Facebook API exception with status code and error type.
     * @param message Human-readable error message
     * @param statusCode HTTP status code from Facebook API
     * @param errorType Error type/code from Facebook API response
     */
    public FacebookApiException(String message, int statusCode, String errorType) {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
    }

    /**
     * Create a Facebook API exception with a cause.
     * @param message Human-readable error message
     * @param statusCode HTTP status code from Facebook API
     * @param errorType Error type/code from Facebook API response
     * @param cause Root cause exception
     */
    public FacebookApiException(String message, int statusCode, String errorType, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
        this.errorType = errorType;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getErrorType() {
        return errorType;
    }

    @Override
    public String toString() {
        return String.format(
            "FacebookApiException{message='%s', statusCode=%d, errorType='%s'}",
            getMessage(),
            statusCode,
            errorType
        );
    }
}
