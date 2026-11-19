create extension if not exists pgcrypto;
create extension if not exists postgis;

create table if not exists public.audit_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_name text not null,
  business_name text not null,
  business_category text not null,
  business_area text not null,
  phone text not null,
  email text,
  website_or_maps_url text,
  interested_package text not null check (interested_package in ('Local Starter','Local Growth','Local Dominance')),
  message text,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new','reviewing','contacted','qualified','converted','closed'))
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  business_name text not null,
  category_slug text not null,
  category_label text not null,
  address text,
  location geography(point,4326),
  contact_name text,
  phone text,
  website text,
  status text not null default 'prospect' check (status in ('prospect','client','inactive'))
);

create table if not exists public.territories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_slug text not null,
  center geography(point,4326) not null,
  radius_meters integer not null default 4828 check (radius_meters = 4828),
  status text not null default 'pending' check (status in ('pending','approved','active','expired','rejected')),
  agreement_signed_at timestamptz,
  subscription_active_until timestamptz,
  approved_by text,
  notes text,
  constraint territory_agreement_required check (
    status not in ('approved','active') or agreement_signed_at is not null
  )
);

create index if not exists businesses_location_gix on public.businesses using gist(location);
create index if not exists territories_center_gix on public.territories using gist(center);
create index if not exists territories_category_status_idx on public.territories(category_slug,status);

-- Admin workflow: evaluate possible conflicts before approving a territory.
-- A conflict is a same-category active/approved territory whose 3-mile radius intersects.
create or replace function public.find_territory_conflicts(
  requested_center geography,
  requested_category text,
  exclude_territory uuid default null
) returns table(territory_id uuid, business_id uuid, distance_meters double precision, status text)
language sql stable as $$
  select t.id, t.business_id, st_distance(t.center, requested_center), t.status
  from public.territories t
  where t.category_slug = requested_category
    and t.status in ('approved','active')
    and (exclude_territory is null or t.id <> exclude_territory)
    and st_dwithin(t.center, requested_center, 4828 + t.radius_meters - 4828)
  order by st_distance(t.center, requested_center);
$$;

-- Keep public access disabled. Use server-side service role only in trusted API/admin code.
alter table public.audit_leads enable row level security;
alter table public.businesses enable row level security;
alter table public.territories enable row level security;
