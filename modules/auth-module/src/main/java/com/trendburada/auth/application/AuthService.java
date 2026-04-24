package com.trendburada.auth.application;

import com.trendburada.auth.api.AuthRegisterRequest;
import com.trendburada.auth.api.BasicLoginRequest;
import com.trendburada.auth.config.AuthVerificationProperties;
import com.trendburada.auth.domain.VerificationCodeEntity;
import com.trendburada.auth.domain.VerificationCodeRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final KeycloakAdminService keycloakAdminService;
    private final VerificationCodeRepository verificationCodeRepository;
    private final VerificationCodeGenerator verificationCodeGenerator;
    private final VerificationMailService verificationMailService;
    private final AuthVerificationProperties verificationProperties;

    public AuthService(KeycloakAdminService keycloakAdminService,
                       VerificationCodeRepository verificationCodeRepository,
                       VerificationCodeGenerator verificationCodeGenerator,
                       VerificationMailService verificationMailService,
                       AuthVerificationProperties verificationProperties) {
        this.keycloakAdminService = keycloakAdminService;
        this.verificationCodeRepository = verificationCodeRepository;
        this.verificationCodeGenerator = verificationCodeGenerator;
        this.verificationMailService = verificationMailService;
        this.verificationProperties = verificationProperties;
    }

    @Transactional(readOnly = true)
    public AccountStatusResponse lookupAccountStatus(String email) {
        return keycloakAdminService.findUserByEmail(email)
                .map(user -> new AccountStatusResponse(email, true, Boolean.TRUE.equals(user.isEmailVerified())))
                .orElseGet(() -> new AccountStatusResponse(email, false, false));
    }

    @Transactional
    public RegisterResult register(AuthRegisterRequest request) {
        String password = request.resolvePassword();
        if (password == null || password.isBlank()) {
            throw new AuthException("Sifre alani bos olamaz.");
        }

        keycloakAdminService.findUserByEmail(request.getEmail()).ifPresent(existing -> {
            throw new AuthException("Bu e-posta ile daha once kayit olusturulmus.");
        });

        String userId = keycloakAdminService.createUser(
                request.getEmail().trim().toLowerCase(),
                request.getFirstName().trim(),
                request.getLastName().trim(),
                password
        );

        createAndSendVerification(userId, request.getEmail(), request.getFirstName() + " " + request.getLastName());
        return new RegisterResult(userId);
    }

    @Transactional
    public void confirm(String userId, String confirmCode) {
        VerificationCodeEntity verificationCode = verificationCodeRepository
                .findTopByUserIdAndCodeAndConsumedAtIsNullOrderByCreatedAtDesc(userId, confirmCode)
                .orElseThrow(() -> new AuthException("Dogrulama kodu gecersiz."));

        if (verificationCode.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new AuthException("Dogrulama kodunun suresi dolmus.");
        }

        keycloakAdminService.markEmailVerified(userId);
        verificationCode.setConsumedAt(OffsetDateTime.now());
        verificationCodeRepository.save(verificationCode);
    }

    @Transactional
    public void resendVerification(String userId) {
        UserRepresentation user = keycloakAdminService.findUserById(userId)
                .orElseThrow(() -> new AuthException("Kullanici bulunamadi."));

        createAndSendVerification(userId, user.getEmail(), buildDisplayName(user));
    }

    @Transactional(readOnly = true)
    public LoginResult login(BasicLoginRequest request) {
        UserRepresentation user = keycloakAdminService.requireUserByEmail(request.username().trim().toLowerCase());
        if (!Boolean.TRUE.equals(user.isEmailVerified())) {
            throw new AuthException("E-posta adresinizi dogrulamadan giris yapamazsiniz.");
        }

        Map<String, Object> tokenResponse = keycloakAdminService.login(request.username(), request.password());
        return new LoginResult(tokenResponse, buildUserPayload(user));
    }

    public void logout(String bearerToken) {
        if (bearerToken == null || bearerToken.isBlank()) {
            throw new AuthException("Gecerli oturum bulunamadi.");
        }
    }

    private void createAndSendVerification(String userId, String email, String fullName) {
        expireActiveCodes(userId);

        VerificationCodeEntity entity = new VerificationCodeEntity();
        entity.setUserId(userId);
        entity.setEmail(email);
        entity.setCode(verificationCodeGenerator.generate());
        entity.setCreatedAt(OffsetDateTime.now());
        entity.setExpiresAt(OffsetDateTime.now().plusMinutes(verificationProperties.getExpiryMinutes()));
        verificationCodeRepository.save(entity);

        verificationMailService.sendVerificationCode(email, fullName, entity.getCode());
    }

    private void expireActiveCodes(String userId) {
        verificationCodeRepository.findByUserIdAndConsumedAtIsNull(userId)
                .forEach(item -> {
                    item.setConsumedAt(OffsetDateTime.now());
                    verificationCodeRepository.save(item);
                });
    }

    private String buildDisplayName(UserRepresentation user) {
        return (user.getFirstName() == null ? "" : user.getFirstName())
                + " "
                + (user.getLastName() == null ? "" : user.getLastName());
    }

    private AuthenticatedUser buildUserPayload(UserRepresentation user) {
        List<AuthenticatedUser.RoleItem> roles = keycloakAdminService.getRealmRoles(user.getId()).stream()
                .map(AuthenticatedUser.RoleItem::new)
                .toList();
        return new AuthenticatedUser(
                user.getId(),
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                Boolean.TRUE.equals(user.isEmailVerified()),
                roles
        );
    }
}
