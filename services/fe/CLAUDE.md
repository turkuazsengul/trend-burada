# services/fe — Frontend (React SPA)

This file holds **FE-specific** convention. The repo-wide workflow (impact analysis,
phases, definition-of-done) lives in the root [`CLAUDE.md`](../../CLAUDE.md); when in
doubt, root wins.

---

## 🧱 Stack

- React 18, npm (package-lock checked in), `--legacy-peer-deps` per `.npmrc`.
- Build: `npm run build` → static files served by nginx in production / compose.
- Dev: `npm start` (CRA-style; runs on `http://localhost:3000` against the gateway).
- Hot-reload dev workflow: keep nginx-compose `web` container up but iterate locally
  with `npm start` against gateway:8090.

---

## 🌐 API access

ALL backend calls go through the gateway at `http://localhost:8090` (or the env var
override). Never call the backend directly at `:8080` from FE code — it bypasses
auth/rate-limiting and the gateway is the public contract.

---

## 🔑 Auth

JWT comes from `/auth/login` via the gateway. Store, refresh, and attach as
`Authorization: Bearer <token>` on every API call. Decode `email` claim from JWT to
display the user; everything else is fetched from `/customer/me/*` endpoints (the
backend resolves the customer from the JWT, not from a client-supplied identifier).

---

## ▶️ Local

From this directory (`services/fe/`):

```sh
npm install --legacy-peer-deps
npm start
npm test --watchAll=false
npm run build
```

Or from repo root:

```sh
make fe.test
make ci             # tests + build for any service touched since main
make up             # full stack including FE container at :3000
```

---

## 🚫 Don't

- Don't bypass the gateway.
- Don't put global workflow rules here — they belong in root `CLAUDE.md`.
- Don't add secrets to `.env.compose` / `.env.development` — those are checked in.
  Use a non-tracked `.env.local` for keys you don't want shared.
