package com.trendburada.customer.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(schema = "customer", name = "customers")
public class CustomerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false, columnDefinition = "UUID DEFAULT gen_random_uuid()")
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String customerCode;

    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 50)
    private String segment;

    @Column(nullable = false, length = 50)
    private String preferredCategory;

    // Self-service profile fields exposed via /api/v1/customer/me. Nullable so that
    // (a) Hibernate's ddl-auto=update can add them to existing tables without rewriting
    // every row and (b) the customer can leave them blank — the FE radio/calendar inputs
    // map to "no preference" when empty. Stored canonical (uppercase enum, ISO date,
    // trimmed digits) by CustomerQueryService.patchMe; the columns themselves intentionally
    // do NOT carry CHECK constraints so a future enum addition (e.g. NON_BINARY) only
    // requires a one-line code change.
    @Column(length = 16)
    private String gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 30)
    private String phone;

    public UUID getId() {
        return id;
    }

    public String getCustomerCode() {
        return customerCode;
    }

    public void setCustomerCode(String customerCode) {
        this.customerCode = customerCode;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSegment() {
        return segment;
    }

    public void setSegment(String segment) {
        this.segment = segment;
    }

    public String getPreferredCategory() {
        return preferredCategory;
    }

    public void setPreferredCategory(String preferredCategory) {
        this.preferredCategory = preferredCategory;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
