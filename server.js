// Vite loads .env for the browser bundle; this server is plain Node, so it
// loads its own. The key is read here and never sent to the page.
import "dotenv/config";

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import Courier from "@trycourier/courier";
import { DEMO_USER_ID } from "./src/demo-user.js";

/**
 * The token server.
 *
 * A Vite app is all browser, and your Courier API key must never go there. So
 * the sample has this one small server: it signs a scoped JWT and hands that to
 * the page. In your own app this is one route on the backend you already have.
 *
 * In dev, Vite serves the UI and proxies /api here (see vite.config.ts).
 * After `npm run build`, this also serves dist/ so `npm start` runs the lot.
 */
const PORT = Number(process.env.PORT ?? 3001);

async function issueToken() {
  const apiKey = process.env.COURIER_API_KEY;

  if (!apiKey || apiKey === "YOUR_COURIER_API_KEY") {
    throw Object.assign(
      new Error("COURIER_API_KEY is not set. Copy .env.example to .env, add your key, and restart."),
      { expected: true },
    );
  }

  // ── Replace this with your own session lookup ────────────────────────────
  // Read the user id from whatever session your app already has. Never take it
  // from the request: a caller who can name any user can read that user's inbox.
  const userId = DEMO_USER_ID;
  // ─────────────────────────────────────────────────────────────────────────

  const client = new Courier({ apiKey });

  const { token } = await client.auth.issueToken({
    scope: `user_id:${userId} inbox:read:messages inbox:write:events`,
    // Always set this. Omitting it mints a token that never expires.
    expires_in: "1 day",
  });

  return { userId, token };
}

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".json": "application/json",
};

const server = createServer(async (req, res) => {
  const json = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  if (req.url?.startsWith("/api/courier/token")) {
    try {
      return json(200, await issueToken());
    } catch (cause) {
      // Without this, a mistyped key surfaces as a blank 500 and the inbox just
      // sits empty. Say what went wrong instead.
      const status = cause?.status;
      const message = cause.expected
        ? cause.message
        : status === 401 || status === 403
          ? "Courier rejected the API key. Check COURIER_API_KEY in .env."
          : `Could not issue a Courier token${status ? ` (HTTP ${status})` : ""}.`;

      console.error("[courier] issueToken failed:", cause);
      return json(500, { error: message });
    }
  }

  // Serve the built app, so `npm start` needs nothing else running.
  try {
    const path = req.url === "/" || !extname(req.url ?? "") ? "index.html" : req.url.slice(1);
    const file = await readFile(join(import.meta.dirname, "dist", path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(file);
  } catch {
    res.writeHead(404).end("Not found. Run `npm run build` first, or use `npm run dev`.");
  }
});

server.listen(PORT, () => console.log(`Courier token server on http://localhost:${PORT}`));
