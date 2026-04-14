# Breeze Login Token Saver

This project only does one job:

1. Open the Breeze login link.
2. Let you login manually.
3. Let you paste the returned `API_Session` / access code.
4. Save the latest access code in Supabase.

No trading happens in this project.

## Safe Key Setup

Do not put real secret keys in `config.js`. GitHub Pages is public, so anything in `config.js` can be seen by anyone.

Use this setup instead:

```text
config.js
  EDGE_FUNCTION_URL only

Supabase Edge Function Secrets
  BREEZE_API_KEY
  BREEZE_ADMIN_PIN
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_TABLE

Supabase Database
  latest API_Session / access code
```

`BREEZE_SECRET_KEY` is not needed for this login-saving webpage.

## Files

- `index.html` - GitHub Pages webpage.
- `app.js` - Calls the Supabase Edge Function.
- `config.js` - Public Edge Function URL only.
- `supabase/functions/breeze-token/index.ts` - Private backend function.
- `supabase.sql` - Database table and locked-down permissions.

## Step 1: Create Supabase Table

Open Supabase SQL Editor and run:

```sql
create table if not exists public.breeze_access_codes (
  id text primary key default 'latest',
  access_code text not null,
  note text,
  source text,
  updated_at timestamptz not null default now()
);

alter table public.breeze_access_codes enable row level security;

drop policy if exists "Allow public read latest Breeze access code" on public.breeze_access_codes;
drop policy if exists "Allow public upsert latest Breeze access code" on public.breeze_access_codes;
drop policy if exists "Allow public update latest Breeze access code" on public.breeze_access_codes;

revoke all on public.breeze_access_codes from anon;
revoke all on public.breeze_access_codes from authenticated;
```

This same SQL is also in `supabase.sql`.

## Step 2: Deploy Edge Function

Create a Supabase Edge Function named:

```text
breeze-token
```

Use the code from:

```text
supabase/functions/breeze-token/index.ts
```

Deploy it with JWT verification disabled. The function uses your admin PIN instead.

```bash
supabase functions deploy breeze-token --no-verify-jwt
```

The repo also includes `supabase/config.toml` with:

```toml
[functions.breeze-token]
verify_jwt = false
```

## Step 3: Add Supabase Edge Function Secrets

In Supabase, add these secrets:

```text
BREEZE_API_KEY=your_real_breeze_api_key
BREEZE_ADMIN_PIN=choose_your_private_pin
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_TABLE=breeze_access_codes
```

The admin PIN is what you will type on the webpage before opening the Breeze login link or saving the access code.

## Step 4: Update config.js

Replace the placeholder with your function URL:

```js
window.APP_CONFIG = {
  EDGE_FUNCTION_URL: "https://YOUR_PROJECT_REF.supabase.co/functions/v1/breeze-token"
};
```

## Step 5: Publish GitHub Pages

Push the repo to GitHub and enable GitHub Pages.

Daily use:

1. Open your GitHub Pages URL.
2. Enter your admin PIN.
3. Click **Open Breeze login**.
4. Login manually.
5. Copy the returned `API_Session`.
6. Paste it into the page.
7. Click **Save to Supabase**.

## Optional: Read Saved Code With Python

`get_access_code.py` can read the latest saved access code if you run it in a trusted place with `SUPABASE_SERVICE_ROLE_KEY`.

This is optional and not required for the login webpage.
