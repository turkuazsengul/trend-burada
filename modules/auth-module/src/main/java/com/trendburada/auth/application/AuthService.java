package com.trendburada.auth.application;

import com.trendburada.auth.api.AuthRegisterRequest;
import com.trendburada.auth.api.BasicLoginRequest;
import com.trendburada.auth.config.AuthVerificationProperties;
import com.trendburada.auth.domain.VerificationCodeEntity;
import com.trendburada.auth.domain.VerificationCodeRepository;
import com.trendburada.customer.application.CustomerProvisioningService;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final KeycloakAdminService keycloakAdminService;
    private final VerificationCodeRepository verificationCodeRepository;
    private final VerificationCodeGenerator verificationCodeGenerator;
    private final VerificationMailService verificationMailService;
    private final AuthVerificationProperties verificationProperties;
    private final CustomerProvisioningService customerProvisioningService;

    public AuthService(KeycloakAdminService keycloakAdminService,
                       VerificationCodeRepository verificationCodeRepository,
                       VerificationCodeGenerator verificationCodeGenerator,
                       VerificationMailService verificationMailService,
                       AuthVerificationProperties verificationProperties,
                       CustomerProvisioningService customerProvisioningService) {
        this.keycloakAdminService = keycloakAdminService;
        this.verificationCodeRepository = verificationCodeRepository;
        this.verificationCodeGenerator = verificationCodeGenerator;
        this.verificationMailService = verificationMailService;
        this.verificationProperties = verificationProperties;
        this.customerProvisioningService = customerProvisioningService;
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

        // Now that the email is verified, link this Keycloak identity to a local customer row
        // so that JWT-scoped endpoints (cart, addresses, ...) can resolve the caller. The
        // verification_code row carries the email we sent the code to, so we use that as the
        // source of truth — matching what the JWT will later carry as the `email` claim.
        provisionCustomerForVerifiedUser(userId, verificationCode.getEmail());
    }

    private void provisionCustomerForVerifiedUser(String userId, String emailFromVerificationCode) {
        // Read the Keycloak user once to get a display name. We tolerate it being unavailable
        // (admin call could fail transiently); the provisioning service will fall back to email.
        Optional<UserRepresentation> keycloakUser = keycloakAdminService.findUserById(userId);
        String fullName = keycloakUser
                .map(this::buildDisplayName)
                .orElse(emailFromVerificationCode);
        String email = keycloakUser
                .map(UserRepresentation::getEmail)
                .filter(e -> e != null && !e.isBlank())
                .orElse(emailFromVerificationCode);

        try {
            customerProvisioningService.ensureCustomer(email, fullName);
        } catch (RuntimeException ex) {
            // Provisioning failure must NOT roll back email verification. Log loudly so ops
            // sees it; the startup backfill runner will pick this user up on the next boot.
            log.error("Customer provisioning failed for verified user {} ({}): {}",
                    userId, email, ex.getMessage(), ex);
        }
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
