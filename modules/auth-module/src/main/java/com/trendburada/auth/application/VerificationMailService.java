package com.trendburada.auth.application;

import com.trendburada.auth.config.AuthVerificationProperties;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class VerificationMailService {

    private final JavaMailSender mailSender;
    private final AuthVerificationProperties properties;

    public VerificationMailService(JavaMailSender mailSender, AuthVerificationProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    public void sendVerificationCode(String targetEmail, String fullName, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            helper.setTo(targetEmail);
            helper.setSubject("TrendBurada Hesap Dogrulama Kodu");
            helper.setFrom(new InternetAddress(properties.getSenderEmail(), properties.getSenderName()));
            helper.setText(buildHtml(fullName, code), true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new AuthException("Dogrulama e-postasi gonderilemedi.");
        }
    }

    private String buildHtml(String fullName, String code) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
                  <h2 style="margin:0 0 12px">TrendBurada Hesap Dogrulama</h2>
                  <p>Merhaba %s,</p>
                  <p>Kaydinizi tamamlamak icin asagidaki dogrulama kodunu kullanin:</p>
                  <div style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:24px 0;color:#111827">%s</div>
                  <p>Bu kod sinirli sure boyunca gecerlidir.</p>
                </div>
                """.formatted(fullName == null ? "Kullanici" : fullName, code);
    }
}
