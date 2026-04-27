# TrendBurada Backend

This repository contains the initial backend foundation for TrendBurada.

## Architecture

- Modular monolith commerce core with Spring Boot
- Domain-separated Maven modules
- Keycloak-backed auth module with email verification
- Separate AI integration boundary for a future Python service
- Single deployable app for the first phase

## Modules

- `shared-kernel`
- `auth-module`
- `customer-module`
- `catalog-module`
- `cart-module`
- `order-module`
- `promotion-module`
- `favorite-module`
- `ai-integration-module`
- `platform-app`

## Build

```bash
./mvnw -q package
```

## Auth Stack With Docker

The full stack (BE + Keycloak + Postgres + Gateway + FE + ...) is now orchestrated
from the **repo root** rather than from this service folder. From the root:

```bash
cp infra/.env.example infra/.env
make up
make health
```

Local ports:

- App (BE): `http://localhost:8080`
- Gateway: `http://localhost:8090`
- Keycloak: `http://localhost:8081`
- Mailpit UI: `http://localhost:8025`

To use your Beaver SMTP account, edit `infra/.env` (at repo root, not here) and
replace the `MAIL_*` values.

## Run

```bash
java -jar modules/platform-app/target/platform-app-0.1.0-SNAPSHOT.jar
```

## Verify

```bash
./mvnw -q verify
```

## Useful endpoints

- `GET /api/v1/auth/account-status?email=...`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/confirm?userId=...&confirmCode=...`
- `POST /api/v1/auth/createConfirm?userId=...`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/architecture/modules`
- `GET /api/v1/catalog/products`
- `GET /api/v1/customer/profile`
- `GET /api/v1/cart/preview`
- `POST /api/v1/ai/recommendations`
