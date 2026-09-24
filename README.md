# Moshi Urban Hotel Booking PMS

React/Vite property-management dashboard with an Express API for staff authentication, roles, permissions, and audit logs.

## Local development

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

The Vite development server runs both the frontend and the local `/api` routes.

## Production build

```bash
npm run lint
npm run build
npm start
```

The build creates:

- `dist/` — compiled frontend assets
- `server.js` — production Express server

The server uses Hostinger's `PORT` environment variable automatically and serves both the API and the frontend.

## Hostinger deployment

1. In hPanel, select **Websites → Add Website → Deploy Web App**.
2. Import this GitHub repository.
3. Select Node.js 20 or 22.
4. Use `npm run build` as the build command.
5. Use `server.js` as the entry file, or `npm start` as the start command when Hostinger asks for one.
6. Add the environment variables below in Hostinger before starting the app.

Required production variables:

```text
NODE_ENV=production
JWT_SECRET=<a unique random value of at least 32 characters>
ADMIN_PASSWORD=<a strong initial staff password>
APP_URL=https://your-domain.example
```

Optional email-code delivery (Resend):

```text
RESEND_API_KEY=<Resend API key>
```

Never commit a real `.env` file. The included `.env.example` contains placeholders only.

## Current storage limitation

Bookings are stored in each browser's local storage. Users, roles, OTP records, and audit logs are stored in server memory and reset whenever the server restarts or is redeployed. Connect a persistent database before using this application as the authoritative system for live hotel operations.
