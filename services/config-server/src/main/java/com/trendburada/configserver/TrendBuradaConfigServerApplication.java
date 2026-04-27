package com.trendburada.configserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

@EnableConfigServer
@SpringBootApplication
public class TrendBuradaConfigServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrendBuradaConfigServerApplication.class, args);
    }
}
