# Digital Chemical Inventory

A web app version of **RASL Form 19, Appendix 4.5.1a** ("Quarterly Inventory
of Priority Chemicals," U.P. NSRI) — the same categories, chemicals, and
quarterly Current Inventory / For Purchase fields as the original Word
form, but filterable, searchable, saveable, and exportable back to a
Word document in the original layout.

This started as a skeleton and is now a working implementation — every
function described below is filled in, not stubbed.

**What's been verified, and how**, since this sandbox can't hold a live
database connection end-to-end (see "A known limitation" below):

- `src/lib/quantity.ts` was tested against all 31 distinct "Quarterly
  Stocking Quantity" strings that actually appear in
  `data/master-catalog.seed.json` (parsed straight from the original
  form), plus edge cases (`"Stock not required"`, under-target vs.
  over-target current inventory). All pass. One real bug was caught and
  fixed this way: an early regex (`boxes?`) only matched "boxe"/"boxes",
  not "box" — worth knowing if you extend the pattern list later.
- `src/lib/services/export.ts` was exercised directly with a hand-built
  document object (no database involved), producing a real `.docx` file
  that was converted back to text with LibreOffice to confirm the header
  block, merged quarter columns, category grouping, and footnote marker
  all render correctly.
- `src/lib/services/{catalog,catalog-snapshot,documents,entries}.ts` and
  `middleware.ts` depend on a live Prisma Client, which this sandbox
  cannot generate (see below). They're written directly against Prisma's
  standard query API (`findMany` / `create` / `upsert` / `$transaction`,
  etc.) and type-check correctly everywhere except the handful of lines
  that need the generated model types themselves.
- Every component was written directly against the DTOs in `src/types`
  and the hooks in `src/hooks`, and the whole project (aside from the
  Prisma-dependent lines) passes `npx tsc --noEmit` with zero errors.

## A known limitation (and why it doesn't affect you)

`npx prisma generate` needs to download a query-engine binary from
`binaries.prisma.sh`. That domain isn't reachable from the sandbox this
project was built in, so a handful of lines in `src/lib/services/*` type-
check against a generic fallback client instead of one that knows about
`Lab`, `CatalogSection`, `InventoryDocument`, etc. — you'd see `tsc` errors
like "Parameter 'tx' implicitly has an 'any' type" if you ran `tsc` here
without a real `generate` having succeeded first. On a normal internet
connection this resolves itself the moment you run `npx prisma migrate dev`
(step 4 below) — nothing in the code needs to change.

---

## How this project is organized

1. **Infrastructure/wiring.** Config files, the Prisma schema,
   `src/lib/prisma.ts`, every `app/api/**/route.ts`,
   `src/app/providers.tsx`, and `src/store/useInventoryStore.ts`.

2. **Business logic.** Every function in `src/lib/services/*`,
   `src/lib/quantity.ts`, `src/lib/pin-session.ts`, every hook in
   `src/hooks/*`, and `middleware.ts` — quantity parsing, the
   catalog-snapshot deep copy, the docx layout, session gating.

   **A note on authentication specifically**, since it went through a real
   design change during development: the app was originally built on
   Better Auth (individual accounts, database-backed sessions), then
   switched to a single shared PIN (see "Authentication" below for why).
   That switch happened *because* of a genuine bug the Better Auth version
   had: `middleware.ts` called a database-backed session check, but
   Next.js Middleware always runs on the Edge Runtime, which cannot run
   Prisma's standard client (no Node.js APIs/native binaries there) - so
   that check silently never worked. Pages were reachable without logging
   in at all, while API routes (which run in the normal Node.js runtime)
   correctly rejected requests with 401. The current PIN system in
   `src/lib/pin-session.ts` sidesteps that whole problem rather than
   working around it: it's built entirely on the Web Crypto API
   (`crypto.subtle`), which is identical in both the Edge and Node.js
   runtimes, so `middleware.ts` now does full, real signature+expiry
   verification with no database involved at all.

3. **Frontend.** Every file in `src/components/*` and every `page.tsx` —
   Tailwind-styled React, reading data through the hooks in bucket 2 and
   writing through `useUpdateEntry`.

---

## Data model

Two families of tables (see `prisma/schema.prisma` for the authoritative
version):

- **Master catalog** (`Lab`, `CatalogSection`, `CatalogItem`) — the
  "living" chemical list. Mutable. `CatalogSection` is a self-referencing
  tree (`parentId`) so it can represent nested categories if a future
  revision of the paper form needs them, even though the *current* form's
  categories are all one flat level under each lab (confirmed by parsing
  the original table — see "Master catalog seed data" below).

- **Inventory documents** (`InventoryDocument`, `DocSection`, `DocItem`,
  `QuarterEntry`) — one `InventoryDocument` per year. When a document is
  created, the current master catalog is **deep-copied** into that
  document's own `DocSection`/`DocItem` rows (`snapshotCatalogIntoDocument`
  in `src/lib/services/catalog-snapshot.ts`, wrapped in a single
  `$transaction` so a failure partway through never leaves a half-copied
  document behind). This is deliberate: editing the master catalog later
  (renaming a chemical, adding a new one) never silently changes a year
  that's already been saved. `QuarterEntry` holds the only two numbers a
  user actually fills in per chemical per quarter — `currentInventory` and
  `forPurchase` — one row per `(docItemId, quarter)`.

Why split "master catalog" from "document snapshot" instead of one table?
Because the chemical list itself barely changes year to year, but each
year's counts obviously do. Keeping them separate means adding a new
chemical to the catalog doesn't require touching every past year, and a
past year's export always reflects exactly what existed when it was
created.

`getDocumentById` and `getMasterCatalogTree` both assemble their tree with
a couple of flat queries plus in-memory reassembly, rather than one deeply
nested Prisma `include` — that sidesteps Prisma's need for a hardcoded max
depth on a self-relation, and works the same way regardless of how deep a
future revision's categories get.

---

## Feature → file map

| Spec requirement | Where it lives |
|---|---|
| Filter by quarter | `QuarterVisibilityToggle.tsx` + `useInventoryStore` |
| Search / "only show selected chemicals" | `ChemicalSearchBox.tsx` + `useInventoryStore` (`searchTerm`, `pinnedItemIds`) |
| Whole-document / print view | `documents/[documentId]/print/page.tsx` → `PrintableInventory.tsx` |
| Save & continue later | Every edit is a `PATCH` to `/api/documents/:id/entries` on cell blur (see `useUpdateEntry`) — there's no separate "save" step, and re-opening a document from `DocumentList` is "continuing" |
| Startup: new vs. continue | `StartupScreen.tsx` (composes `NewInventoryDialog.tsx` + `DocumentList.tsx`) |
| For Purchase suggestion (not auto-written) | `src/lib/quantity.ts` (`computeForPurchaseSuggestion`), called client-side from `ForPurchaseCell.tsx`; only written to the database when the user clicks "Apply" or types a value themselves |
| Export to the original .docx layout | `src/lib/services/export.ts` (`generateInventoryDocx`) — built programmatically with the `docx` library, see below |
| Single-credential login | `src/lib/pin-session.ts` + `middleware.ts` protecting every route except `/login` and the login/logout API routes — see "Authentication" below |

---

## Authentication

The app sits behind a single shared PIN rather than individual accounts —
this was a deliberate simplification made partway through development
(the project started with Better Auth and per-user accounts; see the note
under "Business logic" above for why that was replaced, not just patched).

How it works, all in `src/lib/pin-session.ts`:
- The PIN's **SHA-256 hash** is hardcoded in that file (not the plaintext
  PIN itself) - `POST /api/login` hashes whatever was typed in and compares
  it to that constant.
- On a match, the server issues a **signed cookie**: an expiry timestamp
  plus an HMAC-SHA256 signature over it, keyed by `SESSION_SECRET`. No
  session table, no database lookup on every request - `middleware.ts`
  and every API route just recompute the signature and compare.
- `POST /api/logout` clears the cookie. The "Sign out" link on the startup
  screen calls it.

**Trade-offs worth knowing about, since they're a direct consequence of
"one shared PIN" instead of real accounts:**
- There's no per-user identity anywhere in the data model anymore -
  `QuarterEntry` and `InventoryDocument` don't record *who* made an edit,
  only *when* (`updatedAt`/`createdAt`). If knowing which lab tech changed
  a number ever becomes important, that needs individual accounts back,
  which is a real (if contained) piece of work, not a config flag.
- Anyone with the PIN has full access - there's no viewer/editor
  distinction and no way to revoke one person's access without changing
  the PIN for everyone.
- To change the PIN: compute a new hash (`node -e "const {createHash} =
  require('crypto'); console.log(createHash('sha256').update('your-new-pin').digest('hex'))"`),
  replace the `PIN_HASH_HEX` constant in `src/lib/pin-session.ts`,
  redeploy. Every existing session stays valid until it naturally expires
  (30 days) since the PIN itself isn't part of the signed cookie - only
  rotating `SESSION_SECRET` invalidates sessions immediately, forcing
  everyone to re-enter the PIN.

---

## Master catalog seed data

`data/master-catalog.seed.json` was generated by **programmatically parsing
the original document's table** (converted from `.doc` to `.docx`, then
read with `python-docx`), not hand-typed — this avoids transcription
errors across the 90 chemicals in both labs. The parsing rule was simple
and confirmed against the source: a row with a blank "Quarterly Stocking
Quantity" cell is a category header; a row with that cell filled in is a
chemical.

**Before relying on this for real use**, read it against the original form
once — a few rows in the "SPE Tubes" section contain "OR" alternative-brand
lines that parsed as separate line items rather than true alternatives,
since the source table doesn't distinguish them structurally either. That's
a fair reflection of the original document's own formatting, not a parsing
bug, but worth knowing about.

`scripts/seed.ts` loads this JSON into the database — see Setup, step 5.

---

## Exporting to Word

`generateInventoryDocx` builds the `.docx` file entirely in code with the
`docx` library, rather than filling placeholder tags into a hand-authored
Word template — that keeps the export fully generated from source (no
separate binary file to keep in sync with the schema) while still
reproducing the original's column layout: a merged two-row header (Quarter
1–4 spanning Current Inventory / For Purchase sub-columns), a repeating
table header (`tableHeader: true` on the header rows, so it reprints on
every page the way the original form's "PARTICULARS / QUARTER" row does),
shaded category rows, and a footnote line for asterisked chemicals.

`buildDocxDocument` (the part that actually lays out the file) is exported
separately from `generateInventoryDocx` (the part that fetches a document
and hands it to the builder) specifically so the layout logic can be
tested with a plain in-memory object — that's how it was verified in this
sandbox without a database.

---

## Tech stack (and why)

- **Next.js (App Router) + TypeScript** — one deployable codebase for both
  UI and API, appropriate for a single internal tool rather than running
  separate frontend/backend services.
- **Neon (serverless Postgres) via Prisma** — free tier, no time limit
  (this isn't a trial - it's a permanent free plan as long as usage stays
  under Neon's per-project caps, which this app's dataset is nowhere close
  to). Storage and compute are capped on the free tier (0.5 GB, 100
  CU-hours/month) and it scales to zero when idle (a ~500ms cold start on
  the next query after a quiet stretch) - both are non-issues for a tool a
  few people touch a few times a quarter. Connects over standard
  Postgres/TLS, so no extra driver package is needed beyond `@prisma/client`
  - this app runs as a persistent Node process (see "No Docker" below), not
  edge/serverless functions, so Neon's WebSocket-based serverless driver
  isn't necessary here. Originally built against local SQLite for zero
  external dependencies; swapped to Neon so the database survives
  independently of any one server and gets automatic backups, at the cost
  of depending on a third party's continued free tier. Switching back to
  SQLite (or to any other Postgres host) is a one-line change to
  `datasource.provider`/`url` in `prisma/schema.prisma` - nothing in
  `src/lib/services/*` is Neon-specific.
- **A shared PIN, hashed and signed with the Web Crypto API** — no auth
  library at all, on purpose: see "Authentication" above for the reasoning
  and for how a database-backed auth check in Next.js Middleware (Edge
  Runtime) turned into a real, hard-to-spot bug earlier in this project's
  development. Zero dependencies, zero database tables, works identically
  in Edge and Node.js contexts.
- **TanStack Query + Zustand** — server data (documents, entries) lives in
  Query's cache; pure view state (quarter filter, search term, pinned
  items) lives in a small Zustand store, which is why
  `useInventoryStore` never touches saved inventory numbers.
- **`docx`** — MIT-licensed, generates the export entirely in code (see
  above).
- **No Docker.** Hosted on Render's free web-service tier as a native Node
  process (`npm run build` / `npm run start` - no Dockerfile needed, Render
  detects and builds Node apps directly), with Neon as the database (see
  above). Render's free tier never deletes an idle web service - it just
  spins down after 15 minutes of inactivity and wakes on the next request
  (30-60 second cold start), which is a reasonable trade for a tool that
  goes quiet between quarters. Self-hosting on your own server instead of
  Render is still an option and doesn't need Docker either - see "Deploying
  to Render" below for why Render was chosen over the alternatives, and
  the note at the end of that section for the self-hosted path.

---

## Setup

### 1. Prerequisites

- Node.js 20 or newer (this was built and type-checked against Node 22).
- `npm`.
- A free Neon account and project: [neon.tech](https://neon.tech) → create
  a project (no credit card required). Once it's created, its dashboard's
  "Connection Details" panel gives you two connection strings - keep that
  tab open for the next step.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env`:
- Set `DATABASE_URL` to Neon's **pooled** connection string (the one with
  `-pooler` in the hostname) - this is what the running app uses.
- Set `DIRECT_URL` to Neon's **unpooled** connection string - only
  `prisma migrate` (next step) uses this one; pooled connections don't
  support the advisory locks migrations need.
- Both should end in `?sslmode=require` - Neon requires TLS, and Prisma
  will fail to connect without it.
- Replace `SESSION_SECRET` with a real random value:
  `openssl rand -base64 32`.

### 4. Create the database tables

```bash
npx prisma migrate dev --name init
```

This reads `prisma/schema.prisma`, downloads Prisma's query engine (needs
a normal internet connection — see "A known limitation" above), connects
to Neon over `DIRECT_URL`, and creates every table in your Neon project.
You can confirm it worked by looking at the "Tables" view in Neon's
dashboard.

### 5. Seed the master catalog

```bash
npm run db:seed
```

This loads `data/master-catalog.seed.json` into the `Lab` / `CatalogSection`
/ `CatalogItem` tables — 2 labs, ~14 sections, 90 chemicals.

### 6. Run it

```bash
npm run dev
```

Visit `http://localhost:3000` — you should land on `/login` (via
`middleware.ts`). Enter the PIN (see "Authentication" above for where
that's defined) to reach the startup screen. There's no account to create
first - unlike the Better Auth version this project started with, the PIN
itself *is* the credential.

### 7. Deploying to Render

Render was chosen over the more obvious alternative (Vercel, which makes
Next.js) specifically because Vercel's free Hobby tier's terms restrict it
to personal, non-commercial use - using it for an institute's internal
tool would technically violate that from day one. Render's free tier has
no such restriction, and never deletes an idle web service (it spins down
after 15 minutes of inactivity and wakes on the next request, 30-60 second
cold start - a fine trade for a tool used a few times a quarter).

1. Push this project to a GitHub (or GitLab) repository - Render deploys
   from a connected repo, not a local file upload.
2. In the [Render dashboard](https://dashboard.render.com), choose
   **New +** → **Blueprint**, and point it at your repo. Render will read
   `render.yaml` (already in this project) and set up the web service
   automatically: Node runtime, `npm install && npx prisma generate &&
   npm run build` as the build command, `npm run start` as the start
   command, all on the free plan.
   - Don't have `render.yaml`, or prefer clicking through it manually
     instead? Choose **New +** → **Web Service** instead, connect the
     repo, and fill in the same build/start commands by hand.
3. Render will prompt you for the environment variables listed in
   `render.yaml` (`DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`) since
   they're marked `sync: false` - meaning "ask for these, don't store them
   in the repo." Use the same Neon connection strings from step 3 (or a
   separate "production" Neon project, if you'd rather keep dev and prod
   apart - Neon's free tier allows multiple projects), and a real random
   value for `SESSION_SECRET` (`openssl rand -base64 32` - it doesn't need
   to match your local `.env`'s value; each environment can have its own).
   Unlike the Better Auth version this project started with, there's no
   URL-dependent env var here, so there's no chicken-and-egg step where
   you have to deploy once just to learn the URL before finishing
   configuration - the PIN system doesn't care what domain it's served
   from.
4. Run the database migration once, from your own machine, before (or
   right after) the first deploy - Render Blueprints provision the
   service but don't run `prisma migrate deploy` for you. Make sure your
   local `.env` has `DATABASE_URL` and `DIRECT_URL` set to the same Neon
   project you gave Render (steps 3-4 above already set these up if
   you're deploying the same project you tested locally), then run:
   ```bash
   npx prisma migrate deploy
   ```
   Prisma's CLI reads `.env` automatically, so this works the same way in
   any shell - no need to prefix the command with the connection string
   by hand. (If you do want to point at a different database than the one
   in your local `.env` just for this one command, set the variable
   first with whatever your shell uses - `set DATABASE_URL=...` in
   Windows Command Prompt, `$env:DATABASE_URL="..."` in PowerShell,
   `DATABASE_URL="..." npx prisma migrate deploy` in bash/zsh/macOS/Linux
   - rather than assuming the bash syntax works everywhere.)
5. Seed the master catalog the same way, once - `.env` already has what
   this needs, so it's just:
   ```bash
   npm run db:seed
   ```
6. Visit your Render URL and enter the PIN - no account-creation step
   needed, unlike the Better Auth version this project started with.

**Prefer to self-host instead of using Render?** Nothing about the app
requires Render specifically - run `npm run build` then `npm run start`
on any server you control (a process manager like `systemd` or `pm2` will
restart it on crash/reboot), put a reverse proxy like Caddy in front for
free auto-renewing HTTPS, and point the same `.env` at Neon. No Docker
either way.

---

## What's deliberately out of scope for this first pass

- Role-based permissions (viewer vs. editor vs. an "authorize/sign-off"
  step) — the `status: "draft" | "final"` field on `InventoryDocument`
  leaves room for this later without a schema change.
- A "manage master catalog" admin screen for adding/editing chemicals
  outside of re-running the seed script — `getMasterCatalogTree` in
  `src/lib/services/catalog.ts` is the read side of that; a write side
  (`upsertCatalogItem` or similar) can be added the same way when needed.
- Offline resilience (caching in-flight edits in IndexedDB in case of a
  dropped connection) — every edit currently assumes a live connection to
  save.
- `@tanstack/react-table` is listed as a dependency but the actual grid
  (`InventoryTable.tsx`) is a plain recursive `<table>` driven by the
  Zustand store instead — simpler to read for this project's scope, and
  the filtering/visibility behavior it gives up nothing that the store
  wasn't already doing. Worth swapping in if the grid grows more complex
  (column reordering, virtualized rows for a much longer catalog, etc.).
