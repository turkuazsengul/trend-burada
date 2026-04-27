# TrendBurada — monorepo Makefile.
#
# Single source of truth for "what command do I run?". CLAUDE.md references these targets
# directly; do NOT invent ad-hoc shell incantations elsewhere — add a target here instead.
#
# Two main flows:
#   * Local CI loop:  `make ci`   → only the services touched since main are tested.
#   * Stack lifecycle: `make up`  → full docker stack, then `make health` to verify.

.DEFAULT_GOAL := help
SHELL         := /bin/bash
COMPOSE_FILE  := infra/docker-compose.yml
COMPOSE       := docker compose -f $(COMPOSE_FILE)

# ── Help ──────────────────────────────────────────────────────────────────────
.PHONY: help
help: ## List all targets with their descriptions.
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_.-]+:.*##/ {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ── Stack lifecycle ──────────────────────────────────────────────────────────
.PHONY: up down restart clean logs ps
up: ## Start the full stack (postgres, keycloak, redis, mailpit, config, gateway, be, fe).
	@test -f infra/.env || (echo "infra/.env missing — copy infra/.env.example first."; exit 1)
	$(COMPOSE) up -d --build
	@echo
	@echo "Stack starting. Run 'make health' once containers settle (~60-120s on first build)."

down: ## Stop containers, keep volumes.
	$(COMPOSE) down

restart: down up ## Down then up.

clean: ## Stop containers AND wipe volumes (destroys local DB data).
	$(COMPOSE) down -v

logs: ## Follow logs for all services. Use `make logs SVC=app` for one service.
ifdef SVC
	$(COMPOSE) logs -f $(SVC)
else
	$(COMPOSE) logs -f
endif

ps: ## docker compose ps (with health column).
	$(COMPOSE) ps

# ── Health ────────────────────────────────────────────────────────────────────
.PHONY: health
health: ## Poll every service's health endpoint and print PASS/FAIL.
	@bash scripts/health.sh

# ── CI: per-service ──────────────────────────────────────────────────────────
.PHONY: be.test be.build fe.test fe.build gateway.test gateway.build config-server.test config-server.build
be.test: ## Run backend tests.
	cd services/be && ./mvnw -q test

be.build: ## Build backend (skip tests).
	cd services/be && ./mvnw -q -DskipTests package

fe.test: ## Run frontend tests.
	cd services/fe && npm test --silent --watchAll=false

fe.build: ## Build frontend bundle.
	cd services/fe && npm run build

gateway.test: ## Run gateway tests.
	cd services/gateway && ./mvnw -q test

gateway.build: ## Build gateway (skip tests).
	cd services/gateway && ./mvnw -q -DskipTests package

config-server.test: ## Run config-server tests.
	cd services/config-server && ./mvnw -q test

config-server.build: ## Build config-server (skip tests).
	cd services/config-server && ./mvnw -q -DskipTests package

# ── CI: aggregates ───────────────────────────────────────────────────────────
.PHONY: ci ci.all
ci: ## Run lint + test + build only for services touched since `main`.
	@bash scripts/ci-local.sh

ci.all: ## Run lint + test + build for ALL services. Use before a release.
	@bash scripts/ci-local.sh --all

# ── Convenience: rebuild a single image without restarting the world ─────────
.PHONY: rebuild
rebuild: ## Rebuild ONE service container. Usage: `make rebuild SVC=app`.
ifndef SVC
	$(error Usage: make rebuild SVC=<service>  (e.g. SVC=app))
endif
	$(COMPOSE) build $(SVC)
	$(COMPOSE) up -d $(SVC)
