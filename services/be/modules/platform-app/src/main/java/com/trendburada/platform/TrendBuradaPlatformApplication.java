package com.trendburada.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.trendburada")
@EntityScan(basePackages = "com.trendburada")
@EnableJpaRepositories(basePackages = "com.trendburada")
public class TrendBuradaPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrendBuradaPlatformApplication.class, args);
    }
}
