// Zero-dependency static file server with HTTP Basic Auth.
// Serves the Vite build in ./dist behind a username/password gate.
//
//   DEMO_USER      username (default "demo")
//   DEMO_PASSWORD  password; if unset, the site is served WITHOUT auth
//   PORT           listen port (default 8080; App Platform sets this)
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT) || 8080;
const USER = process.env.DEMO_USER || "demo";
const PASSWORD = process.env.DEMO_PASSWORD || "";
const REALM = "doctl next-gen demo";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
};

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorized(req) {
  if (!PASSWORD) return true; // no password configured -> open (local preview)
  const header = req.headers["authorization"] || "";
  if (!header.startsWith("Basic ")) return false;
  let decoded = "";
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }
  const idx = decoded.indexOf(":");
  if (idx === -1) return false;
  const user = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);
  return timingSafeEqual(user, USER) && timingSafeEqual(pass, PASSWORD);
}

async function resolveFile(urlPath) {
  // Strip query, decode, prevent path traversal.
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  let rel = path.normalize(clean).replace(/^(\.\.[/\\])+/, "");
  if (rel === "/" || rel === "") rel = "/index.html";
  let filePath = path.join(DIST, rel);
  if (!filePath.startsWith(DIST)) filePath = path.join(DIST, "index.html");
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
    await fs.access(filePath);
    return filePath;
  } catch {
    // SPA fallback
    return path.join(DIST, "index.html");
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" });
    return res.end("ok");
  }
  if (!authorized(req)) {
    res.writeHead(401, {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "content-type": "text/plain; charset=utf-8",
    });
    return res.end("Authentication required.");
  }
  try {
    const filePath = await resolveFile(req.url || "/");
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "content-type": MIME[ext] || "application/octet-stream",
      "cache-control": ext === ".html" ? "no-cache" : "public, max-age=3600",
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("Internal error");
  }
});

server.listen(PORT, () => {
  console.log(`doctl demo listening on :${PORT} (auth: ${PASSWORD ? "on" : "off"})`);
});
