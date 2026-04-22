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

    public Optional<UserRepresentation> findUserById(String userId) {
        try {
            UserRepresentation user = realm().users().get(userId).toRepresentation();
            return Optional.ofNullable(user);
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    public String createUser(String email, String firstName, String lastName, String rawPassword) {
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(rawPassword);
        credential.setTemporary(false);

        UserRepresentation user = new UserRepresentation();
        user.setUsername(email);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEnabled(false);
        user.setEmailVerified(false);
        user.setCredentials(List.of(credential));

        Response response = realm().users().create(user);
        if (response.getStatus() >= 300) {
            throw new AuthException("Kullanici olusturulamadi. E-posta zaten kayitli olabilir.");
        }

        String userId = CreatedResponseUtil.getCreatedId(response);
        assignRealmRole(userId, "USER");
        return userId;
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
