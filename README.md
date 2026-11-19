# PIFELEV Digital

A responsive Next.js landing page for PIFELEV Digital's local visibility service in Cagayan de Oro, including package information, a free audit inquiry form, and the initial Supabase territory-management foundation.

## Run locally

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add your Supabase project URL and server-side service-role key.
4. Run `npm run dev` and open http://localhost:3000.

The site can render without Supabase credentials, but the audit form intentionally returns a configuration error until the database connection is configured. It never pretends to save an inquiry.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Copy the Project URL to `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the service-role key to `SUPABASE_SERVICE_ROLE_KEY` in Vercel Environment Variables only. Never expose or commit this key.
5. Set `NEXT_PUBLIC_SITE_URL` to the deployed website URL and redeploy.

The schema creates audit leads, business records and 3-mile territory records. Territory approvals remain an admin workflow: verify the business location and category, check overlaps, and require a signed agreement before approval. The radius is stored as 4,828 metres (approximately 3 miles). Production admin authentication, approval screens, billing/subscription synchronization, and category-equivalence rules are not yet implemented.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Select the Next.js framework preset.
3. Add the environment variables above.
4. Deploy, then test the audit form using a real test inquiry.
5. Confirm the inserted record in Supabase before announcing that lead intake is live.

## Commercial information currently shown

- Local Starter: ₱4,900 setup + ₱2,500/month
- Local Growth: ₱7,500 setup + ₱4,500/month
- Local Dominance: ₱12,500 setup + ₱7,500/month

The initial engagement proposal is three months, then month-to-month. Setup is paid before implementation; monthly management is paid in advance. Advertising spend and third-party costs are separate. Do not promise rankings, leads or customer counts. Territory exclusivity applies only to eligible participating PIFELEV clients, subject to availability and written agreement; it does not exclude independent competitors.

## Current implementation boundary

This commit provides the public marketing site, validated lead-intake API and starter database schema. It does not create a live Supabase project, configure credentials, publish a Vercel deployment, or activate territory agreements.
