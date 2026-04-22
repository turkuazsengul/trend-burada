package com.trendburada.auth.application;

import com.trendburada.auth.config.AuthVerificationProperties;
import java.security.SecureRandom;
import org.springframework.stereotype.Component;

@Component
public class VerificationCodeGenerator {

    private final SecureRandom secureRandom = new SecureRandom();
    private final AuthVerificationProperties properties;

    public VerificationCodeGenerator(AuthVerificationProperties properties) {
        this.properties = properties;
    }

    public String generate() {
        int digits = Math.max(4, properties.getCodeLength());
        int min = (int) Math.pow(10, digits - 1);
        int max = (int) Math.pow(10, digits) - 1;
        return String.valueOf(secureRandom.nextInt(max - min + 1) + min);
    }
}
