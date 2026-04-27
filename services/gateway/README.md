# TrendBurada Gateway

Single entry point for frontend traffic.

## Run

```bash
mvn -q spring-boot:run
```

## Verify

```bash
mvn -q verify
```

## Notes

- Uses Spring Cloud Gateway
- Reads centralized route config from `trend-burada-config-server`
- Intended frontend base URL should point here instead of the backend app directly
