
## Runtime Config for cPanel

This project supports runtime config through `public/runtime-config.js`.

The app reads backend URLs in this order:
1. `window.__APP_CONFIG__` from `runtime-config.js`
2. `process.env.REACT_APP_*`

This matters for cPanel because CRA normally bakes env variables into the build at compile time. With `runtime-config.js`, the deployed frontend can point to the correct backend services without changing source code.

### Local development

Local development still works with `.env.development`.

### Production and cPanel

For cPanel deployments, generate `build/runtime-config.js` during CI:

```bash
npm run build:cpanel
```

The included GitHub Actions workflow uses repository secrets for backend URLs and uploads the `build` folder to cPanel over FTP.

Required GitHub secrets:

- `REACT_APP_KEYCLOAK_BASE_URL`
- `REACT_APP_KEYCLOAK_TOKEN_URL`
- `REACT_APP_USER_SERVICE_BASE_URL`
- `REACT_APP_LOGIN_URL`
- `REACT_APP_USER_INFO_URL`
- `REACT_APP_USER_UPDATE_URL`
- `REACT_APP_REGISTER_URL`
- `REACT_APP_REGISTER_CONFIRM_URL`
- `REACT_APP_REGISTER_CREATE_CONFIRM_URL`
- `REACT_APP_LOGOUT_URL`
- `REACT_APP_KEYCLOAK_CLIENT_ID`
- `REACT_APP_KEYCLOAK_GRANT_TYPE`
- `REACT_APP_MY_USER_INFO_URL`
- `REACT_APP_MY_ORDER_URL`
- `REACT_APP_MY_ADDRESS_URL`
- `REACT_APP_USE_DEMO_LOCAL_AUTH`
- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `FTP_SERVER_DIR`
