# Auth Module Overview

## Scope

This auth module is designed for the current frontend contract.

Implemented flows:

- account status lookup
- register
- verification code email sending
- confirm by code
- resend verification code
- login through Keycloak direct grant
- logout placeholder response

## Main integrations

- Keycloak for identity and token issuing
- PostgreSQL for verification code persistence
- SMTP for verification email delivery

## Frontend compatibility

The current frontend expects legacy-style responses like:

- `returnCode`
- `returnData`
- `detail.exceptionDetailMessage`

The auth endpoints intentionally return this structure so the existing `AuthService` and `RegisterService` can be wired with minimal frontend change.

## Docker testing

Default local test stack:

- PostgreSQL for app data
- PostgreSQL for Keycloak
- Keycloak with imported `trend-burada` realm
- Mailpit for local email capture
- Spring Boot app

For real email delivery, replace the `MAIL_*` values in `infra/.env` with your Beaver SMTP account settings.

## Current endpoint contract

### `GET /api/v1/auth/account-status`

Query param:

- `email`

Returns:

- whether the user exists
- whether the email is verified

### `POST /api/v1/auth/register`

Payload:

- follows the current frontend register payload
- password is read from `credentials[].value`

Behavior:

- creates a disabled Keycloak user
- assigns the `USER` realm role
- creates a verification code
- sends the code by email

### `POST /api/v1/auth/confirm`

Query params:

- `userId`
- `confirmCode`

Behavior:

- validates active verification code
- marks Keycloak user as enabled + email verified

### `POST /api/v1/auth/createConfirm`

Query params:

- `userId`

Behavior:

- expires previous active codes
- generates and sends a new code

### `POST /api/v1/auth/login`

Header:

- `Authorization: Basic base64(email:password)`

Behavior:

- checks email verification state
- requests access token from Keycloak
- returns token payload and user summary
