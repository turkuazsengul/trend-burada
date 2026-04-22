package com.trendburada.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.trendburada")
public class TrendBuradaPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrendBuradaPlatformApplication.class, args);
    }
}
