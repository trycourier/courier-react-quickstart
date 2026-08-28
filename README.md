# Courier Inbox — React quickstart

A working [Courier Inbox](https://www.courier.com/docs/in-app/add-an-inbox) in a React +
Vite app. Two files do the work: a small server that mints a scoped token, and a
component that renders the feed.

```
server.js              mints a short-lived JWT (never reaches the browser)
src/CourierInbox.tsx   signs in and renders the inbox
```

## Run it

```bash
npm install
cp .env.example .env   # paste your API key
npm run dev
```

Open `localhost:5173`, then run `npm run send` in a second terminal. The message arrives
in the open page without a refresh.

Any [API key](https://app.courier.com/settings/api-keys) works. Every Courier environment
ships with the Courier Inbox provider already configured, so there is nothing to set up.

## Why there is a server

A Vite app is all browser, and your Courier API key must never go there. The browser gets
a JWT instead: scoped to one user, and expiring.

```
browser                    server.js                  courier
   │                            │                        │
   │  GET /api/courier/token    │                        │
   ├───────────────────────────►│  POST /auth/issue-token│
   │                            ├───────────────────────►│
   │   { userId, token }        │◄───────────────────────┤
   │◄───────────────────────────┤                        │
   │                                                     │
   │  signIn({ userId, jwt }) ─── websocket ────────────►│
   │◄──────────────── new messages, in real time ────────┤
```

In your own app this is one route on the backend you already have. `server.js` exists
here only so the sample runs on its own.

`npm run dev` starts it alongside Vite, which proxies `/api` to it (see
`vite.config.ts`) so everything stays same-origin and there is no CORS to configure.
After `npm run build`, `npm start` serves the built app from the same server.

`src/demo-user.js` pins the user id to a constant so the server and the send script agree
without you wiring up auth first. In your own app, read it from your session — and read
it there, never from the request. A caller who can name any user can read that user's
inbox.

## Two things worth knowing

### Effects run twice in development

React 19 StrictMode mounts every component twice. A second `signIn` signs the first user
out again, so `src/CourierInbox.tsx` guards it with a ref.

### The inbox takes its height from its parent

`CourierInbox` fills its container's width and inherits height, so `.inbox` in
`src/index.css` sets one. Without a height on the parent, the inbox collapses.

## Keep the session alive

The SDKs do not refresh tokens. Before the current one expires, mint a new JWT and call
`signIn` again with it. Match `expires_in` to your own session length — a short-lived
token can expire while a tab stays open, which quietly empties the inbox.

`expires_in` is optional, and omitting it mints a token that **never expires**. Always
set it. Rotating the API key that signed it is the only way to revoke one.

## Empty inbox?

Suspect the token before anything else. An expired or mis-scoped JWT signs in silently
and returns no messages.

- The two `inbox:` scopes are the minimum for a working feed.
- Signing in with a `tenantId` hides messages sent without one.
- Send to the same `user_id` the token was scoped to.

[Troubleshooting](https://www.courier.com/docs/in-app/authenticate-users#troubleshooting)
walks the causes in order.

## Scripts

| | |
|---|---|
| `npm run dev` | Vite on `localhost:5173` plus the token server on `3001` |
| `npm run build` | Production build |
| `npm start` | Serve the build and the token route from one server |
| `npm run send` | Send one message to the demo user's inbox |
| `npm run typecheck` | `tsc --noEmit` |

## Docs

- [Add an inbox to React](https://www.courier.com/docs/guides/add-an-inbox-to-react)
- [Add an inbox](https://www.courier.com/docs/in-app/add-an-inbox) — every framework
- [Authenticate users](https://www.courier.com/docs/in-app/authenticate-users) — scopes, refresh, EU
- [Customize the inbox](https://www.courier.com/docs/in-app/customize-the-inbox) — theming
