package dk.unievent.app.infrastructure.exception;

public class TokenCompromisedException extends RuntimeException {

    public TokenCompromisedException() {
        super("Refresh token family compromised");
    }
}
