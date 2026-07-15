# 🗄️ kv

A tiny **token-authed persistent JSON/KV store** over HTTP. The glue you keep reaching for: stash a cursor, a feature flag, a last-seen id, a counter — from any script or app, no database to stand up.

## Use it from a script
```bash
T='Bearer '"$KV_TOKEN"
# store JSON
curl -X PUT -H "authorization: $T" -d '{"lastId":42}' https://kv.antonio-code.duckdns.org/api/kv/steam/cursor
# read it
curl -H "authorization: $T" https://kv.antonio-code.duckdns.org/api/kv/steam/cursor
# atomic counter
curl -X POST -H "authorization: $T" https://kv.antonio-code.duckdns.org/api/incr/deploys/count
```

## Features
- Slash-namespaced keys (`app/section/key`), values are arbitrary JSON.
- Optional per-key TTL (`?ttl=<sec>`), swept every minute.
- Atomic `incr` (`?by=<n>`) for counters.
- Single bearer token; **fails closed** if `KV_TOKEN` is unset.
- Minimal browser console at `/` (token stays in your `localStorage`).

## Run
```bash
bun install && KV_TOKEN=secret bun start   # http://localhost:3000
bun test
```

## Config (env)
| var | default | meaning |
|-----|---------|---------|
| `KV_TOKEN` | — | bearer token for all `/api` (required) |
| `MAX_VALUE_BYTES` | `262144` | per-value cap (256 KB) |
| `DATA_DIR` | `data` | JSON persistence (PVC in prod) |

## API
- `GET /api/kv` list · `GET|PUT|DELETE /api/kv/:key` · `POST /api/incr/:key`
- `GET /health` (no auth)

## Deploy
GHCR `ghcr.io/juninmd/kv:latest` → ArgoCD `app-charts/kv` → `https://kv.antonio-code.duckdns.org`. PVC for `data/`; `KV_TOKEN` via ExternalSecret.

MIT.
