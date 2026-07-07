# PawShop Ops

A multi-tenant commerce operations app built with Next.js, TypeScript, Supabase/Postgres, and Playwright. The centerpiece is a safe CSV ingestion workflow: upload, map columns, validate in staging, detect duplicates and invalid rows, review the result, then promote only clean data.

This repository is intentionally more than a CRUD dashboard. It demonstrates the implementation concerns that matter in production: tenant-scoped Row Level Security, explicit role permissions, auditable staging data, database constraints, webhook idempotency, and end-to-end acceptance tests.

## What is implemented

- Four-step CSV import workflow at `/imports`
- Automatic source-column matching with editable mappings
- Required-field and numeric validation
- Duplicate detection within an import batch
- Staging review with ready, duplicate, and error states
- Product CRUD, search, filters, inventory status, and dashboard metrics
- Multi-tenant schema with owner, admin, operator, and viewer roles
- RLS policies for products, import jobs, and staged rows
- Webhook event ledger keyed by provider event ID for retry-safe processing
- Playwright coverage for CRUD, responsive UI, and the full import path
- pgTAP policy tests proving users cannot read or update another tenant

## Architecture

```text
CSV upload
   ↓
column mapping
   ↓
import_jobs + import_rows (tenant-scoped staging)
   ↓ validate / deduplicate / review
   ↓
products (production tables, single transaction)
```

The browser demo performs validation locally so the workflow can be evaluated without credentials. The production database model lives in [`supabase/migrations/20260708000000_secure_imports.sql`](supabase/migrations/20260708000000_secure_imports.sql): every business row carries an `organization_id`, policies derive access from `auth.uid()`, and client access to the webhook ledger is denied by default.

## Security verification

RLS is tested as behavior, not assumed from policy text. [`supabase/tests/rls.sql`](supabase/tests/rls.sql) creates two users and organizations, authenticates as each user, and asserts that:

1. A member sees only their organization’s records.
2. Cross-tenant reads return no rows.
3. Cross-tenant mutations do not affect protected records.
4. Server-only webhook events remain inaccessible to clients.

The service-role key must only be used in server-side routes and is never exposed through a `NEXT_PUBLIC_*` variable.

## Webhook idempotency

Payment providers retry events, so side effects must not run merely because a request arrived. `webhook_events.event_id` is a primary key. A handler verifies the signature, opens a transaction, inserts the event ID, and performs the business transition only if that insert succeeds. A duplicate delivery hits the unique constraint and returns success without creating a second order, email, inventory decrement, or payout.

## Local setup

```bash
npm install
cp .env.local.example .env.local
npx supabase start
npm run dev
```

Required browser-safe environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key>
```

Open [http://localhost:3000/imports](http://localhost:3000/imports). A sample CSV is preloaded; you can also upload your own.

## Verification

```bash
npm run build
npm test
```

The Playwright suite covers the import acceptance path (map → validate → identify duplicate/error → promote valid rows), product CRUD, search/filtering, validation, and mobile layouts.

## Stack

- Next.js 16 App Router and React 19
- TypeScript
- Supabase/PostgreSQL with Row Level Security
- Tailwind CSS
- Playwright and pgTAP
- Vercel-ready deployment
