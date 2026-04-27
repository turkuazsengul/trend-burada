package com.trendburada.auth;

import com.trendburada.auth.config.AuthKeycloakProperties;
import com.trendburada.auth.config.AuthVerificationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan(basePackageClasses = AuthModuleConfiguration.class)
@EnableConfigurationProperties({
        AuthKeycloakProperties.class,
        AuthVerificationProperties.class
})
public class AuthModuleConfiguration {
}
