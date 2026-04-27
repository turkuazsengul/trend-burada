package com.trendburada.auth.api;

import com.trendburada.auth.application.AccountStatusResponse;
import com.trendburada.auth.application.AuthException;
import com.trendburada.auth.application.AuthService;
import com.trendburada.auth.application.LegacyResponse;
import com.trendburada.auth.application.LoginResult;
import com.trendburada.auth.application.LogoutRequest;
import com.trendburada.auth.application.RegisterResult;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/account-status")
    public LegacyResponse<AccountStatusResponse> accountStatus(@RequestParam String email) {
        return LegacyResponse.success(authService.lookupAccountStatus(email));
    }

    @PostMapping("/register")
    public LegacyResponse<RegisterResult> register(@Valid @RequestBody AuthRegisterRequest request) {
        return LegacyResponse.success(authService.register(request));
    }

    @PostMapping("/confirm")
    public LegacyResponse<Void> confirm(@RequestParam String userId, @RequestParam String confirmCode) {
        authService.confirm(userId, confirmCode);
        return LegacyResponse.successWithoutData();
    }

    @PostMapping("/createConfirm")
    public LegacyResponse<Void> createConfirm(@RequestParam String userId) {
        authService.resendVerification(userId);
        return LegacyResponse.successWithoutData();
    }

    @PostMapping("/login")
    public LegacyResponse<LoginResult> login(@RequestHeader("Authorization") String authorization) {
        return LegacyResponse.success(authService.login(parseBasicAuthorization(authorization)));
    }

    @PostMapping("/logout")
    public LegacyResponse<Void> logout(@RequestHeader(value = "Authorization", required = false) String authorization,
                                       @RequestBody(required = false) LogoutRequest request) {
        authService.logout(authorization);
        return LegacyResponse.successWithoutData();
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(AuthException.class)
    public ResponseEntity<LegacyResponse<Void>> handleAuthException(AuthException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(LegacyResponse.failure(exception.getMessage()));
    }

    private BasicLoginRequest parseBasicAuthorization(String authorization) {
        if (authorization == null || !authorization.startsWith("Basic ")) {
            throw new AuthException("Basic Authorization basligi zorunludur.");
        }

        String decoded = new String(Base64.getDecoder().decode(authorization.substring(6)), StandardCharsets.UTF_8);
        int separatorIndex = decoded.indexOf(':');
        if (separatorIndex < 0) {
            throw new AuthException("Authorization bilgisi gecersiz.");
        }

        return new BasicLoginRequest(decoded.substring(0, separatorIndex), decoded.substring(separatorIndex + 1));
    }
}
