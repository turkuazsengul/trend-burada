# Architecture Overview

## Why this repo is separate

Keeping backend in a dedicated repository is a good fit here because:

- backend and frontend can evolve independently
- Java and AI-related runtime concerns stay isolated from React tooling
- CI/CD stays cleaner
- future extraction into multiple services becomes easier

## Initial topology

```text
Frontend (trend-burada-web)
        |
        v
  TrendBurada Platform App
        |
        +-- customer-module
        +-- catalog-module
        +-- cart-module
        +-- order-module
        +-- promotion-module
        +-- favorite-module
        +-- ai-integration-module
```

## Extraction path

The current codebase is intentionally split by domain so later we can extract:

- `catalog-module` -> `catalog-service`
- `search` can be added as its own module/service
- `cart-module` -> `cart-service`
- `order-module` -> `order-service`
- `customer-module` -> `customer-service`

## AI direction

`ai-integration-module` is only the Java-side boundary for now. Real LLM orchestration can later move to a dedicated Python service and speak to the commerce APIs through internal contracts.
