# services/be — Backend (Spring Boot)

This file holds **BE-specific** convention. The repo-wide rules (workflow phases,
impact analysis template, definition-of-done) live in the root [`CLAUDE.md`](../../CLAUDE.md);
when in doubt, root wins.

---

## 🧱 Stack

- Java 17, Spring Boot 3.3.x, Maven multi-module.
- PostgreSQL 16 (schema-per-domain: `customer`, `cart`, `catalog`, `ordering`, `favorite`, `promotion`).
- Keycloak 25 (OAuth2 resource server; trusted-email lookup wires the JWT subject to a
  local customer row).
- Schema migrations: idempotent `init-schemas.sql` driven via `spring.sql.init` (no
  Flyway/Liquibase). `@@` is the statement separator.
- OpenAPI: code-first with springdoc; bearer scheme registered globally in
  `OpenApiConfig`.
- Tests: standalone MockMvc slice tests, the `CartControllerTest` /
  `CustomerAddressControllerTest` pair is the reference for new controllers.

---

## 🧩 Modules

```
modules/
├── shared-kernel              # ApiResponse, PagedResult — used by all
├── auth-module                # Keycloak admin, register/confirm, verification mail
├── customer-module            # CustomerEntity, addresses, provisioning service
├── catalog-module             # products
├── cart-module                # carts, cart_items
├── order-module               # orders
├── promotion-module           # banners
├── favorite-module            # favourites
├── ai-integration-module      # boundary to a future AI svc (Java-only stub today)
└── platform-app               # Spring Boot main + REST controllers + security/openapi config
```

Dependency rule: `platform-app` depends on every domain module; domain modules depend
ONLY on `shared-kernel` (and `auth-module → customer-module` for the provisioning seam
added 2026-04-26). NO domain → domain deps. NO module → platform-app.

---

## 🔑 Auth → Customer linkage

Two seams to remember:

1. **Resolve identity to customer**: `AuthenticatedCustomerResolver` in
   `platform-app/api/`. Reads JWT `email` (or email-format `preferred_username`),
   looks up `CustomerEntity` by email. Throws `AccessDeniedException` (→ 403) when
   no customer is linked. Use this on EVERY `/customer/me/*` endpoint.

2. **Provision a customer at confirm time**: `CustomerProvisioningService` in
   `customer-module/application/`. Idempotent get-or-create, `REQUIRES_NEW` so a
   provisioning failure cannot roll back email verification.
   `KeycloakCustomerBackfillRunner` (`platform-app/bootstrap/`) re-runs at boot for
   already-verified Keycloak users that pre-date the provisioning seam.

When adding a new JWT-scoped endpoint:
- Pull the customer via `AuthenticatedCustomerResolver.resolveCustomer(auth)` (gives
  the entity — saves a second DB hit if you need the UUID).
- NEVER accept `customerCode` / `customerId` in path / query / body. The controller
  must be impossible to steer at another customer.
- Mirror the cart/address slice tests: assert that any client-supplied identifier is
  ignored, that cross-customer access surfaces as 404 (not 403, to avoid existence
  leaks).

---

## 🗃️ DB conventions

- Migrations append-only at the bottom of `platform-app/src/main/resources/db/init-schemas.sql`.
- Every block is idempotent (`CREATE TABLE IF NOT EXISTS`, `ALTER ... IF NOT EXISTS`).
- Statements are separated with `@@` (configured in `application.yml`).
- New table FK to `customer.customers(id)` uses `ON DELETE CASCADE` unless there's a
  reason to retain orphans.
- Constraint naming: `idx_<table>_<col>`, `uq_<table>_<purpose>`.

---

## 🧪 Test pattern

Standalone MockMvc, no `@SpringBootTest`, no Testcontainers. Mock the resolver and
service; assert security boundaries explicitly. Reference:
- `platform-app/src/test/.../CartControllerTest.java`
- `platform-app/src/test/.../CustomerAddressControllerTest.java`
- `platform-app/src/test/.../AuthenticatedCustomerResolverTest.java`

When a service has invariants worth exercising (default-address ordering, ownership
checks), add a mocked-repo unit test in the module: see
`customer-module/src/test/.../AddressServiceTest.java`.

---

## ▶️ Local

From this directory (`services/be/`):

```sh
./mvnw -q test          # tests
./mvnw -q -DskipTests package
./mvnw spring-boot:run -pl modules/platform-app  # only the BE, against your own DB/keycloak
```

Or from repo root:

```sh
make be.test            # tests
make ci                 # tests + build for any service touched since main
make up                 # full stack (postgres + keycloak + ... + be + gateway + fe)
```

---

## 🚫 Don't

- Don't put global instructions (workflow, language rule, definition-of-done) here.
  They belong in root `CLAUDE.md`.
- Don't create per-domain JpaRepository in `platform-app`. Repositories live in their
  domain module.
- Don't add a `customerCode` parameter to a `/customer/me/*` endpoint.
- Don't use `flushAutomatically=true` on a `@Modifying` query that touches a row your
  caller is also dirtying — order it before the caller's mutation, or use REQUIRES_NEW.
