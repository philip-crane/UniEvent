package dk.unievent.app.application.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.context.IContext;
import org.thymeleaf.TemplateEngine;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTests {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private TemplateEngine templateEngine;

    @InjectMocks
    private EmailService emailService;

    private MimeMessage mimeMessage;

    @BeforeEach
    void setUp() throws Exception {
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@unievent.dk");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "https://unievent.dk");
        ReflectionTestUtils.setField(emailService, "organizerKeyExpirationHours", 24L);

        jakarta.mail.Session session = jakarta.mail.Session.getInstance(new Properties());
        mimeMessage = new MimeMessage(session);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    void sendOrganizerInvitationEmailShouldProcessCorrectTemplateAndSend() throws MessagingException {
        when(templateEngine.process(eq("emails/organizer-invitation"), any(IContext.class)))
            .thenReturn("<html>Welcome!</html>");

        emailService.sendOrganizerInvitationEmail("organizer@example.com", "INVITE-KEY-123");

        verify(templateEngine).process(eq("emails/organizer-invitation"), any(IContext.class));
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendOrganizerInvitationEmailShouldPassCorrectContextVariables() throws MessagingException {
        ArgumentCaptor<IContext> contextCaptor = ArgumentCaptor.forClass(IContext.class);
        when(templateEngine.process(any(String.class), contextCaptor.capture())).thenReturn("<html></html>");

        emailService.sendOrganizerInvitationEmail("organizer@example.com", "MY-KEY");

        IContext context = contextCaptor.getValue();
        assertEquals("MY-KEY", context.getVariable("key"));
        assertEquals(24L, context.getVariable("expirationHours"));
        assertEquals("https://unievent.dk/signup-organizer?key=MY-KEY", context.getVariable("registerUrl"));
    }

    @Test
    void sendSimpleEmailShouldSendWithoutTemplateEngine() throws MessagingException {
        emailService.sendSimpleEmail("user@example.com", "Hello", "Plain text body");

        verifyNoInteractions(templateEngine);
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendOrganizerInvitationEmailAsyncShouldSwallowMessagingException() throws Exception {
        when(templateEngine.process(any(String.class), any(IContext.class)))
            .thenReturn("<html></html>");
        doThrow(new org.springframework.mail.MailSendException("SMTP down"))
            .when(mailSender).send(any(MimeMessage.class));

        assertDoesNotThrow(() -> emailService.sendOrganizerInvitationEmailAsync("x@example.com", "KEY"));
    }
}
