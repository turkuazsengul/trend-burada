# TrendBurada — Monorepo

E-commerce platform: React frontend + Spring Cloud Gateway + Spring Boot backend +
Spring Cloud Config Server. All four services and the shared infra live here.

For the working contract on how Claude should operate in this repo, see
[`CLAUDE.md`](CLAUDE.md). For the full architecture, see [`docs/system-map.md`](docs/system-map.md).

---

## 🗂️ Layout

```
.
├── services/
│   ├── be/                ← backend (Spring Boot modular monolith)
│   ├── fe/                ← frontend (React SPA)
│   ├── gateway/           ← Spring Cloud Gateway
│   └── config-server/     ← Spring Cloud Config Server (config-repo/ inside)
├── infra/
│   ├── docker-compose.yml ← meta-stack: postgres + keycloak + redis + 4 services
│   ├── .env.example       ← copy to .env
│   └── keycloak/          ← realm export
├── docs/                  ← system-map, ADRs, cross-cutting docs
├── scripts/               ← ci-local.sh, health.sh
├── .claude/commands/      ← slash commands (see CLAUDE.md backlog)
├── Makefile               ← single source of truth for dev commands
└── CLAUDE.md              ← workflow contract
```

---

## ▶️ 5-minute quickstart

```bash
# 1. Copy environment template
cp infra/.env.example infra/.env

# 2. Bring up the full stack (first build ~2-3 min)
make up

# 3. Wait for everything to settle, then verify
make health

# 4. Open
#    Frontend:        http://localhost:3000
#    Gateway:         http://localhost:8090
#    Backend (direct): http://localhost:8080/swagger-ui.html
#    Keycloak:        http://localhost:8081  (admin / admin)
#    Mailpit:         http://localhost:8025
```

When you're done:

```bash
make down       # stop containers, keep DB data
make clean      # stop AND wipe DB volumes
```

---

## 🔁 Local CI loop

After every code change:

```bash
make ci         # runs lint + test + build for any service touched since `main`
```

Before a release / large PR:

```bash
make ci.all     # exhaustive — every service
```

---

## 🧰 Per-service local dev

Each service can also be developed in isolation, against the rest of the stack
brought up by `make up`. See the per-service `CLAUDE.md`:

- [`services/be/CLAUDE.md`](services/be/CLAUDE.md)
- [`services/fe/CLAUDE.md`](services/fe/CLAUDE.md)
- [`services/gateway/CLAUDE.md`](services/gateway/CLAUDE.md)
- [`services/config-server/CLAUDE.md`](services/config-server/CLAUDE.md)

---

## 🐛 Common issues

**`make up` fails on first run**: usually the `infra/.env` file is missing. Copy from
`.env.example`. If it's a Keycloak realm import error, `make clean && make up` to
start fresh — sometimes the imported realm conflicts with leftover Postgres state.

**FE container shows nginx default page**: the React build failed; check `make logs SVC=web`.

**BE returns 403 on `/customer/me/*` even with a valid JWT**: the customer row was
not provisioned. Should auto-resolve on the next `make up` thanks to
`KeycloakCustomerBackfillRunner`. If it still doesn't, check
[`docs/system-map.md`](docs/system-map.md) → "Identity & customer linkage".

**Port already in use**: another stack is bound to 3000/8080/8090/8081/5432/5433/6379/8025.
`make down` (or `lsof -i :<port>`) to free it.

---

## 🏷️ Migration note

This repo replaces the four previous repos:

- `trend-burada-web` → `services/fe/`
- `trend-burada-be` → `services/be/`  *(this folder before consolidation)*
- `trend-burada-gateway` → `services/gateway/`
- `trend-burada-config-server` → `services/config-server/`

The originals were tagged `v0.1.0-pre-monorepo` and archived on 2026-04-26.
