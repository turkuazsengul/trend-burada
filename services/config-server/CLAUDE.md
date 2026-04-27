# services/config-server — Config Server (Spring Cloud Config)

This file holds **config-server-specific** convention. The repo-wide workflow lives
in the root [`CLAUDE.md`](../../CLAUDE.md); when in doubt, root wins.

---

## 🧱 Stack

- Spring Cloud Config Server, Java 17, port 8888.
- `native` profile → reads from the local `config-repo/` directory (committed in this
  service folder; data lives at `services/config-server/config-repo/`).
- Files use the `<application>-<profile>.yml` naming Spring expects:
  - `application.yml` — defaults shared by everyone
  - `trend-burada-platform-app.yml` / `-dev.yml` / `-docker.yml` — backend
  - `trend-burada-gateway.yml` / `-dev.yml` / `-docker.yml` — gateway

---

## 🔁 Where do config changes live?

- Adding a property used by BE: edit the right `trend-burada-platform-app-<profile>.yml`.
- Adding a route at the gateway: edit `trend-burada-gateway-<profile>.yml` (NOT the
  gateway's own `src/`).
- Anything that affects multiple services: prefer `application.yml`.

After editing: BE/GW must be restarted (or hit `/actuator/refresh` if you wired the
bus). The simplest dev loop is `make rebuild SVC=app` / `SVC=gateway`.

---

## ⚠️ Secrets

`config-repo/` is checked in. Do NOT put real secrets here. Use placeholders that
read from env vars at the consuming service:

```yaml
spring:
  datasource:
    password: ${SPRING_DATASOURCE_PASSWORD}
```

Then set the env var in `infra/.env` (which IS gitignored).

---

## ▶️ Local

From this directory (`services/config-server/`):

```sh
./mvnw -q test
./mvnw spring-boot:run    # standalone, serves http://localhost:8888
curl http://localhost:8888/trend-burada-platform-app/docker
```

Or from repo root:

```sh
make config-server.test
make rebuild SVC=config-server
```

---

## 🚫 Don't

- Don't put global workflow rules here — root `CLAUDE.md`.
- Don't commit secrets to `config-repo/`. Env-var placeholders only.
- Don't fork a config file per environment when the diff is tiny — Spring's profile
  composition (`application.yml` + `application-<profile>.yml`) handles overlay.
