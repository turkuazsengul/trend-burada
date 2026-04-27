# TrendBurada — System Map

> Monorepo edition. Replaces the previous external doc at
> `github.com/turkuazsengul/trend-burada-ai/system-map.md`. All four services and the
> shared infra now live in this repo under `services/` and `infra/`.

---

## 🧠 System Overview

TrendBurada is a modular e-commerce platform. A React SPA talks to a Spring Cloud
Gateway, which routes to a Spring Boot modular monolith backend. Configuration is
served by a Spring Cloud Config Server reading from a local config repo.

---

## 🧩 Services

| Path | What | Tech |
|---|---|---|
| `services/fe` | React SPA (customer + seller + admin portals) | React 18, npm, nginx |
| `services/be` | Backend modular monolith — auth, catalog, cart, orders, addresses, promotions | Spring Boot 3, Java 17, Postgres, Keycloak |
| `services/gateway` | API gateway — routing, JWT, rate limit, CORS | Spring Cloud Gateway, Redis |
| `services/config-server` | Centralized config server | Spring Cloud Config |
| `services/config-server/config-repo` | Per-app / per-profile YAML configs | (data only) |

Supporting infra (under `infra/` + docker-compose):
- **Postgres** — two instances: `postgres-app` (BE) on 5432, `postgres-keycloak` on 5433
- **Keycloak 25** — auth on 8081 (management on 8080 inside the network)
- **Redis 7** — for gateway rate limiting
- **Mailpit** — dev SMTP catcher on 1025 + UI on 8025

---

## 🔄 Request flow

```
User
  │
  ▼
[FE :3000]  ─ React SPA, served by nginx in compose / `npm start` in dev
  │  HTTPS (in prod) / HTTP (locally), Authorization: Bearer <jwt>
  ▼
[Gateway :8090]  ─ JWT validation, rate limit, route map (config-repo)
  │
  ▼
[BE :8080]  ─ Spring Boot modular monolith
  │ ├── reads/writes ─► [Postgres-app :5432]
  │ └── admin client  ─► [Keycloak :8080 (internal) / :8081 (host)]
  │
  ▼
DB
```

Out-of-band: BE pulls properties from [Config Server :8888] at boot. Keycloak
persists its own data in `postgres-keycloak`.

---

## 🔑 Identity & customer linkage

Two seams to remember (added 2026-04-26):

1. **Resolve identity → customer**: `AuthenticatedCustomerResolver` (in
   `services/be/modules/platform-app`) reads the JWT `email` claim, finds the
   `customer.customers` row by email, and returns the entity. 403 if no row.

2. **Provision a customer at email-confirm time**: `CustomerProvisioningService` (in
   `services/be/modules/customer-module`) is called by `AuthService.confirm`, plus a
   startup `KeycloakCustomerBackfillRunner` walks the realm at boot and provisions
   any verified user that doesn't yet have a customer row. This is what closes the
   "Keycloak says yes, BE says 403" loop.

---

## 🛠️ Local stack

```sh
cp infra/.env.example infra/.env
make up         # starts everything (first build ~2-3 min)
make health     # PASS/FAIL across all 6 endpoints
make logs       # follow all logs
make logs SVC=app   # follow just one
make down       # stop, keep volumes
make clean      # stop AND wipe volumes
```

---

## 📐 Cross-service change checklist

Adding a new endpoint usually touches more than one service. The full checklist:

- [ ] BE: controller + service + tests + (if persisted) migration in `init-schemas.sql`
- [ ] Gateway: route in `services/config-server/config-repo/trend-burada-gateway-<profile>.yml`
      + public-paths allow list if no auth needed
- [ ] FE: API client + UI + tests
- [ ] Config: new env vars added to `infra/.env.example`
- [ ] Docs: this file updated if the request flow / identity model changed
- [ ] CI: `make ci` green; `make up && make health` all PASS

---

## 📜 History

- 2026-04-25 — Customer addresses CRUD + JWT-scoped resolver added.
- 2026-04-26 — Provisioning seam (confirm-time + startup backfill) added.
- 2026-04-26 — 4 separate repos consolidated into this monorepo (fresh start, old
  repos tagged `v0.1.0-pre-monorepo` and archived).
