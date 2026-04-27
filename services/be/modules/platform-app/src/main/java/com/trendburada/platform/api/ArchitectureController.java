package com.trendburada.platform.api;

import com.trendburada.shared.ApiResponse;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/architecture")
public class ArchitectureController {

    @GetMapping("/modules")
    public ApiResponse<Map<String, Object>> modules() {
        return ApiResponse.ok(Map.of(
                "runtimeShape", "modular-monolith",
                "futureAiService", "python-fastapi",
                "extractableModules", List.of(
                        "customer",
                        "catalog",
                        "cart",
                        "order",
                        "promotion",
                        "favorite",
                        "ai-integration"
                )
        ));
    }
}
