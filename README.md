# SAMZONE

SAMZONE is a React and TypeScript shopping experience with a Supabase-backed
catalog, local cart/wishlist/compare state, visual search, styling tools, and
browser-based virtual try-on overlays.

> Status: portfolio/demo project. It is not yet approved for production use
> because real authentication, verified Supabase RLS policies, and a clean lint
> baseline are still outstanding.

## Architecture

- `frontend/` — Vite, React 19, TypeScript, Tailwind CSS, Framer Motion, and
  Supabase client queries.
- `backend/` — Spring Boot API for catalog maintenance and AI-assisted flows.
- `db/migrations/` — PostgreSQL/Supabase schema and catalog-query indexes.
- `scripts/` — explicit catalog import and maintenance scripts. These are not
  run by the application build.

The deployed browser app uses Supabase for catalog reads. The Spring service is
only needed for the API-backed AI and catalog-maintenance routes.

## Requirements

- Node.js 20.19+ or 22.12+ (required by Vite 7)
- Java 21 (backend)
- A Supabase project with the migrations applied

## Local setup

```bash
cp frontend/.env.example frontend/.env.local
cd frontend
npm install
npm run dev
```

In another terminal, export/configure the backend variables in your shell or
IDE (Spring Boot does not automatically load `.env` files), then start it:

```bash
cd backend
./mvnw spring-boot:run
```

The frontend defaults to `http://localhost:8080` for API-backed operations.

## Environment variables

Frontend (`frontend/.env.local`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public Supabase anon key; never use a service-role key here |
| `VITE_API_URL` | No | Spring API origin; defaults to `http://localhost:8080` |
| `VITE_USE_MOCK_API` | No | Set `true` only for local mock-data development |

Backend/hosting environment:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Optional | Enables the backend Gemini-assisted response path |
| `SAMZONE_ADMIN_API_KEY` | Required for admin writes | Server-only token for maintenance POST routes |
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Production | PostgreSQL connection configuration |

## Database

Apply migrations in order:

1. `20240723_add_flipkart_schema.sql`
2. `20240724_add_shopping_infrastructure.sql`
3. `20240725_product_search_performance.sql`

The final migration creates the indexed `search_vector` used by catalog search.
Before exposing a Supabase project publicly, enable and test Row Level Security
for every table and Storage bucket. Do not rely on the browser client for
authorization.

## Validation

```bash
cd frontend && npm run build
cd backend && ./mvnw -DskipTests package
```

`npm run lint` currently reports legacy issues that must be resolved before a
production release. The backend maintenance endpoints intentionally deny POST
writes unless `SAMZONE_ADMIN_API_KEY` is configured and sent via the
server-only `X-Admin-Token` header.

## Product limitations

- Login is a local demo flow, not Supabase Auth.
- Cart, wishlist, and compare state are stored locally in the browser.
- Some legacy components and navigation links are not part of the live route
  graph; they require consolidation before a production release.
- No screenshots are committed because the project does not contain stable,
  reviewable capture assets.

## License

Released under the [MIT License](LICENSE).
