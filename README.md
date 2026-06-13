# PawShop Admin

PawShop Admin is a full-stack pet supply store admin dashboard for managing products, inventory, and product status.

## Features

- Product CRUD (Create, Read, Update, Delete)
- Search products by name or category
- Filter products by status (Active / Inactive)
- Dashboard summary cards (Total, Active, Inactive, Low Stock)
- Delete confirmation modal
- Responsive UI (mobile-friendly)
- Playwright E2E tests

## Tech Stack

- **Next.js 16** — App Router, Server Components, API Routes
- **TypeScript** — Full type safety
- **Tailwind CSS** — Utility-first styling
- **Supabase** — PostgreSQL database
- **Playwright** — End-to-end testing
- **Vercel** — Deployment

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats and recent products |
| `/products` | Full product list with search and filter |
| `/products/new` | Add a new product |
| `/products/[id]/edit` | Edit an existing product |

## Product Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated |
| `name` | string | Product name |
| `category` | string | Product category |
| `price` | number | Price in USD |
| `stock` | number | Quantity in stock |
| `status` | active / inactive | Listing status |
| `image_url` | string (optional) | Product image |
| `description` | string (optional) | Product description |
| `created_at` | timestamp | Auto-generated |
| `updated_at` | timestamp | Auto-updated |

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/pawshop-admin.git
cd pawshop-admin
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

**Option A — Supabase Cloud (recommended for deployment)**

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste + run the contents of `supabase/schema.sql`
3. Copy your credentials from **Project Settings → API**

**Option B — Local Supabase via Docker (recommended for development)**

> Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) running

```bash
npx supabase start
```

This auto-applies the schema and seed data. Credentials are printed in the terminal output.

To stop when done:
```bash
npx supabase stop
```

Local Studio dashboard: [http://localhost:54323](http://localhost:54323)

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your credentials:

```env
# Cloud Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# OR Local Supabase (after running npx supabase start)
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<key from supabase start output>
```

> `.env.local` is gitignored and will never be committed.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Automated Testing

This project includes Playwright E2E tests covering:

- Dashboard smoke test (loads, stats visible)
- Sidebar navigation
- Product list loads
- Add product flow
- Edit product flow
- Delete product flow (with confirmation modal)
- Search/filter behavior
- Form validation (empty fields, price > 0)
- Mobile viewport (390px)
- **Full CRUD flow**: Add → View in table → Edit price → Search → Delete

### Run Tests

```bash
npx playwright test
```

### Run Tests with UI

```bash
npx playwright test --ui
```

### View Test Report

```bash
npx playwright show-report
```

### Install Playwright browsers (first time)

```bash
npx playwright install
```

## Deploy on Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

> Use your **cloud** Supabase credentials for Vercel — not the local ones.

## Project Structure

```
pawshop-admin/
├── app/
│   ├── layout.tsx          # Root layout with sidebar
│   ├── page.tsx            # Dashboard page
│   ├── globals.css         # Global styles
│   ├── products/
│   │   ├── page.tsx        # Product list
│   │   ├── new/page.tsx    # Add product
│   │   └── [id]/edit/      # Edit product
│   └── api/
│       ├── products/       # CRUD API routes
│       └── stats/          # Dashboard stats
├── components/
│   ├── Sidebar.tsx
│   ├── StatsCard.tsx
│   ├── ProductTable.tsx
│   ├── ProductForm.tsx
│   ├── SearchFilter.tsx
│   └── DeleteModal.tsx
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Helper functions
├── tests/
│   └── e2e/
│       └── pawshop.spec.ts # Playwright tests
├── supabase/
│   └── schema.sql          # Database schema + seed data
└── playwright.config.ts
```
