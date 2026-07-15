import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { KVStore } from "./store";
import { dashboardHtml } from "./dashboard";

const store = new KVStore();
const TOKEN = process.env.KV_TOKEN ?? "";
const MAX_VALUE = Number(process.env.MAX_VALUE_BYTES ?? 256 * 1024);

function authed(header: string | undefined): boolean {
  if (!TOKEN) return false; // fail closed when unconfigured
  const provided = header?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

const app = new Hono();

app.get("/", (c) => c.html(dashboardHtml));
app.get("/health", (c) => c.json({ ok: true, keys: store.list().length }));

// Everything under /api requires the bearer token.
app.use("/api/*", async (c, next) => {
  if (!authed(c.req.header("authorization"))) return c.json({ error: "unauthorized" }, 401);
  await next();
});

app.get("/api/kv", (c) => c.json({ keys: store.list() }));

app.get("/api/kv/:key{.+}", (c) => {
  const value = store.get(c.req.param("key"));
  return value === undefined ? c.json({ error: "not found" }, 404) : c.json({ key: c.req.param("key"), value });
});

app.put("/api/kv/:key{.+}", async (c) => {
  const raw = await c.req.text();
  if (raw.length > MAX_VALUE) return c.json({ error: "value too large" }, 413);
  let value: unknown;
  try {
    value = raw === "" ? null : JSON.parse(raw);
  } catch {
    return c.json({ error: "body must be valid JSON" }, 400);
  }
  const ttl = Number(c.req.query("ttl")) || undefined;
  const entry = await store.set(c.req.param("key"), value, ttl);
  return c.json({ key: c.req.param("key"), value: entry.value, expiresAt: entry.expiresAt }, 201);
});

app.delete("/api/kv/:key{.+}", async (c) => {
  const ok = await store.del(c.req.param("key"));
  return c.json({ ok }, ok ? 200 : 404);
});

app.post("/api/incr/:key{.+}", async (c) => {
  const by = Number(c.req.query("by")) || 1;
  try {
    return c.json({ key: c.req.param("key"), value: await store.incr(c.req.param("key"), by) });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "failed" }, 409);
  }
});

if (import.meta.main) {
  if (!TOKEN) console.warn("[kv] KV_TOKEN unset — all /api requests will 401");
  setInterval(() => store.sweep(), 60_000);
  const port = Number(process.env.PORT ?? 3000);
  console.log(`kv on :${port}`);
  Bun.serve({ port, fetch: app.fetch });
}

export { app, store };
