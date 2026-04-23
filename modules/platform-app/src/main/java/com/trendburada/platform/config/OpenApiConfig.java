package com.trendburada.platform.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI trendBuradaOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Trend Burada Platform API")
                        .description("Trend Burada backend servisleri icin Swagger/OpenAPI dokumantasyonu")
                        .version("v1")
                        .contact(new Contact()
                                .name("Trend Burada")
                                .email("dev@trendburada.local"))
                        .license(new License()
                                .name("Internal Use")));
    }
}
