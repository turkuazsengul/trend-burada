# services/gateway — API Gateway (Spring Cloud Gateway)

This file holds **gateway-specific** convention. The repo-wide workflow (impact
analysis, phases, definition-of-done) lives in the root [`CLAUDE.md`](../../CLAUDE.md);
when in doubt, root wins.

---

## 🧱 Stack

- Spring Cloud Gateway (reactive). Java 17.
- OAuth2 / JWT validation against the Keycloak realm `trend-burada`.
- Redis-backed rate limiting.
- Routes / filters configured via `services/config-server/config-repo/trend-burada-gateway*.yml`
  — NOT inside this service's own `src/`. Means most route changes are config-only.

---

## 🔁 Where do route changes live?

If the change is "expose a new backend endpoint":
1. Add the route in the appropriate config-repo file (look at
   `trend-burada-gateway-docker.yml` for the docker stack).
2. If the endpoint is public (no JWT), add it to the public-paths allow list in the
   same file.
3. Touch this repo's `src/` only when changing FILTER behaviour (custom auth, rate
   limit policy, header rewrite). Pure routing = config change only.

---

## ✅ Done = these are also true

- New route is reachable via `make up` + `curl http://localhost:8090/<path>`.
- Auth-required routes return 401 without a token, 200 with one.
- `make health` shows gateway PASS.

---

## ▶️ Local

From this directory (`services/gateway/`):

```sh
./mvnw -q test
./mvnw -q -DskipTests package
./mvnw spring-boot:run    # against your own config-server / keycloak
```

Or from repo root:

```sh
make gateway.test
make rebuild SVC=gateway   # rebuild + restart only this container
```

---

## 🚫 Don't

- Don't put global workflow rules here — root `CLAUDE.md`.
- Don't hardcode routes in `src/` if the same change can be a config-repo edit.
- Don't accept a `customerCode` / `customerId` query param at the gateway level. JWT
  is the source of truth; the BE will resolve identity from the token.
