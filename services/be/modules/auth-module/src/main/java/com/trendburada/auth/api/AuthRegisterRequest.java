package com.trendburada.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class AuthRegisterRequest {

    @NotBlank
    private String username;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    private List<CredentialPayload> credentials;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public List<CredentialPayload> getCredentials() {
        return credentials;
    }

    public void setCredentials(List<CredentialPayload> credentials) {
        this.credentials = credentials;
    }

    public String resolvePassword() {
        if (credentials == null || credentials.isEmpty()) {
            return null;
        }
        return credentials.stream()
                .filter(item -> "password".equalsIgnoreCase(item.getType()))
                .map(CredentialPayload::getValue)
                .findFirst()
                .orElse(null);
    }

    public static class CredentialPayload {
        private String type;
        private String value;

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }
    }
}
