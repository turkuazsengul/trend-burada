package com.trendburada.auth.application;

import com.trendburada.auth.config.AuthKeycloakProperties;
import jakarta.ws.rs.core.Response;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class KeycloakAdminService {

    private final Keycloak keycloak;
    private final RestClient restClient;
    private final AuthKeycloakProperties properties;

    public KeycloakAdminService(Keycloak keycloak, RestClient restClient, AuthKeycloakProperties properties) {
        this.keycloak = keycloak;
        this.restClient = restClient;
        this.properties = properties;
    }

    public Optional<UserRepresentation> findUserByEmail(String email) {
        List<UserRepresentation> users = realm().users().searchByEmail(email, true);
        return users.stream().findFirst();
    }

    /**
     * Returns a single page of users for pagination. Used by the customer backfill runner
     * which walks the realm at boot to provision local customer rows for already-verified
     * Keycloak identities. Page size is bounded so a realm with many users does not load the
     * entire user table into memory at once.
     *
     * @param firstResult zero-based offset of the first user in the page
     * @param maxResults  page size (Keycloak admin API caps this server-side, typically 100)
     */
    public List<UserRepresentation> listUsers(int firstResult, int maxResults) {
        return realm().users().list(firstResult, maxResults);
    }

    public Optional<UserRepresentation> findUserById(String userId) {
        try {
            UserRepresentation user = realm().users().get(userId).toRepresentation();
            return Optional.ofNullable(user);
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    public String createUser(String email, String firstName, String lastName, String rawPassword) {
        return createUser(email, firstName, lastName, rawPassword, RoleNames.CUSTOMER, false, false);
    }

    public String createUser(String email,
                             String firstName,
                             String lastName,
                             String rawPassword,
                             String roleName,
                             boolean enabled,
                             boolean emailVerified) {
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(rawPassword);
        credential.setTemporary(false);

        UserRepresentation user = new UserRepresentation();
        user.setUsername(email);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEnabled(enabled);
        user.setEmailVerified(emailVerified);
        user.setCredentials(List.of(credential));

        Response response = realm().users().create(user);
        if (response.getStatus() >= 300) {
            throw new AuthException("Kullanici olusturulamadi. E-posta zaten kayitli olabilir.");
        }

        String userId = CreatedResponseUtil.getCreatedId(response);
        assignRealmRole(userId, roleName);
        return userId;
    }

    public void ensureRealmRole(String roleName, String description) {
        try {
            realm().roles().get(roleName).toRepresentation();
        } catch (Exception ex) {
            RoleRepresentation role = new RoleRepresentation();
            role.setName(roleName);
            role.setDescription(description);
            realm().roles().create(role);
        }
    }

    public void ensureBootstrapUser(String email,
                                    String firstName,
                                    String lastName,
                                    String rawPassword,
                                    String roleName) {
        String normalizedEmail = email.trim().toLowerCase();
        Optional<UserRepresentation> existing = findUserByEmail(normalizedEmail);
        String userId;
        if (existing.isPresent()) {
            UserRepresentation user = existing.get();
            user.setUsername(normalizedEmail);
            user.setEmail(normalizedEmail);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEnabled(true);
            user.setEmailVerified(true);
            realm().users().get(user.getId()).update(user);
            userId = user.getId();
        } else {
            userId = createUser(normalizedEmail, firstName, lastName, rawPassword, roleName, true, true);
        }

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(rawPassword);
        credential.setTemporary(false);
        realm().users().get(userId).resetPassword(credential);
        syncRealmRoles(userId, List.of(roleName));
    }

    public List<String> getRealmRoles(String userId) {
        return realm().users().get(userId).roles().realmLevel().listAll().stream()
                .map(RoleRepresentation::getName)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public void markEmailVerified(String userId) {
        UserRepresentation user = realm().users().get(userId).toRepresentation();
        user.setEnabled(true);
        user.setEmailVerified(true);
        realm().users().get(userId).update(user);
    }

    public Map<String, Object> login(String username, String password) {
        URI uri = URI.create(properties.getBaseUrl() + "/realms/" + properties.getRealm() + "/protocol/openid-connect/token");
        String body = "client_id=" + encode(properties.getClientId())
                + "&grant_type=" + encode(properties.getDirectGrantType())
                + "&username=" + encode(username)
                + "&password=" + encode(password)
                + buildClientSecretPart();

        try {
            return Objects.requireNonNull(restClient.post()
                    .uri(uri)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .body(body)
                    .retrieve()
                    .body(Map.class));
        } catch (Exception ex) {
            throw new AuthException("Kullanici adi veya sifre hatali.");
        }
    }

    public UserRepresentation requireUserByEmail(String email) {
        return findUserByEmail(email).orElseThrow(() -> new AuthException("Kullanici bulunamadi."));
    }

    private void assignRealmRole(String userId, String roleName) {
        RoleRepresentation role = realm().roles().get(roleName).toRepresentation();
        realm().users().get(userId).roles().realmLevel().add(List.of(role));
    }

    private void syncRealmRoles(String userId, List<String> desiredRoles) {
        List<RoleRepresentation> currentRoles = realm().users().get(userId).roles().realmLevel().listAll();
        if (!currentRoles.isEmpty()) {
            realm().users().get(userId).roles().realmLevel().remove(currentRoles);
        }

        List<RoleRepresentation> rolesToAssign = desiredRoles.stream()
                .map(roleName -> realm().roles().get(roleName).toRepresentation())
                .toList();
        realm().users().get(userId).roles().realmLevel().add(rolesToAssign);
    }

    private RealmResource realm() {
        return keycloak.realm(properties.getRealm());
    }

    private String buildClientSecretPart() {
        if (properties.getClientSecret() == null || properties.getClientSecret().isBlank()) {
            return "";
        }
        return "&client_secret=" + encode(properties.getClientSecret());
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
