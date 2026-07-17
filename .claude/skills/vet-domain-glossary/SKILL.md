---
name: vet-domain-glossary
description: The actual entities and domain rules in PawShop Admin today — not a vet/clinic domain despite the name
---

# Domain glossary for PawShop Admin

**Important**: despite the "PawShop" name, this codebase has no veterinary/clinic domain at all —
no patients, no owners, no pets, no appointments. If you were expecting those entities because of
the project name, they don't exist yet. The actual domain, as implemented, is a generic
multi-tenant **retail inventory + CSV-import audit trail** app. Don't invent
patient/appointment/clinic features without the user explicitly asking for a domain pivot — that
would be new scope, not a bug fix.

## Entities that actually exist

### `Product` (table `products`)
The core business object. Fields: `id`, `name`, `category` (free-text column, but the UI
constrains input to 8 hardcoded categories in `components/ProductForm.tsx`: Shampoo & Grooming,
Food & Treats, Toys, Accessories, Health & Wellness, Carriers & Travel, Bedding & Furniture,
Training), `price` (decimal, `check > 0`), `stock` (int, `check >= 0`), `status`
(`'active' | 'inactive'`), `image_url`, `description`, `created_at`, `updated_at` (auto-touched by
a trigger), `organization_id` (tenant FK, added in the second migration).

### `Organization` (table `organizations`)
The tenant/workspace entity. Fields: `id`, `name`, `created_at`. In the UI/forms this is called a
"workspace" (see the `ProductForm.tsx` label "Workspace"), not "organization" — the two terms mean
the same thing; DB/code use `organization`, UI copy uses "workspace."

### `OrganizationMember` (table `organization_members`)
Join table linking a user to an organization with a role. Composite PK
`(organization_id, user_id)`. `role` ∈ `owner | admin | operator | viewer` — `viewer` is read-only,
the other three can create/update/delete. This table is what all RLS tenant-scoping checks against
(see the `rls-policies` skill). No dedicated TS type exists for it; it's only touched via SQL/RPC.

### `PlatformAdmin` (table `platform_admins`)
A user who can act across every organization (cross-tenant `for all` RLS access on
`organizations`, `organization_members`, `products`, `import_jobs`, `import_rows` — but explicitly
**not** `webhook_events`). Fields: `user_id` (PK, FK to `auth.users`), `created_at`. Checked ad hoc
in `app/layout.tsx` to decide what the sidebar/account menu shows. Only one is currently seeded
(a hardcoded UUID in the migration, commented `-- Wanda.`).

### `ImportJob` (table `import_jobs`)
One CSV upload attempt. Fields: `id`, `organization_id`, `file_name`, `status`
(`staging | reviewed | promoted | failed`), `column_mapping` (jsonb — maps source CSV columns to
`Product` fields), `created_by` (FK to `auth.users`), `created_at`, `promoted_at`. No TS type
exists — `components/ImportWorkspace.tsx` models its own local state for the mapping/review UI
and only touches the server at the final "promote" step.

### `ImportRow` (table `import_rows`)
One row within an import job, after validation. Fields: `id` (bigint identity), `import_job_id`,
`organization_id`, `row_number`, `payload` (jsonb — the row's parsed data), `validation_status`
(`ready | duplicate | error`), `validation_errors` (jsonb array of message strings),
`promoted_product_id` (nullable FK to `products` — set once the row becomes a real product). No
TS type exists; mirrored by an ad hoc inline shape in `ImportWorkspace.tsx`.

### `WebhookEvent` (table `webhook_events`)
Fields: `event_id` (text, PK — the provider's event ID, making retried deliveries a no-op via the
unique constraint), `organization_id` (nullable), `event_type`, `payload` (jsonb),
`processed_at`. **Schema-only** — no application code (no route, no signature verification, no
handler) reads or writes this table today, despite README language implying a working webhook
handler exists. Exists purely to demonstrate a server-only RLS-locked table pattern.

## Domain rules actually enforced

- A product must have `price > 0` and `stock >= 0` (DB `check` constraints, also re-validated
  client-side in `ProductForm.tsx` and server-side in `app/api/products/route.ts`).
- A product's `category` has no DB-level enum constraint — only a UI-level hardcoded list. A
  product could theoretically get an arbitrary category value via direct API/DB access; this is
  not currently prevented at the database layer.
- CSV import rows are checked for duplicates **by product name, case-insensitively, within the
  target organization** — see `promote_product_import`'s
  `lower(name) = lower(payload ->> 'name')` check, re-verified server-side at promotion time even
  if the browser-side review already flagged/cleared it, to stay correct against concurrent
  imports.
- A user can only manage (create/update/delete) products, import jobs, or staged rows in
  organizations where their `organization_members.role` is `owner`, `admin`, or `operator` —
  `viewer` is read-only. Platform admins bypass this per-org check entirely (see `PlatformAdmin`
  above) but never gain access to `webhook_events`.

## TODO: decide on this

If the intent is to eventually pivot this project toward an actual veterinary/pet-clinic domain
(patients, owners, pets, appointments, clinics) to match the "PawShop" name more literally, that's
a real scope decision the user hasn't made in this codebase yet — flag it rather than assuming it
and building clinic-shaped features on top of the current product/inventory schema.
