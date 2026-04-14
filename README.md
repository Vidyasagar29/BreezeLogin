# Breeze Login Token Saver

This project only does one job:

1. Open the Breeze login link.
2. Let you login manually.
3. Let you paste the returned `API_Session` / access code.
4. Save the latest access code in Supabase.
5. Provide API key, secret key, and access code to trusted programs through a protected Edge Function.

The webpage does not trade. Your PC or GitHub programs can call the Edge Function to fetch the credentials they need.

## Safe Key Setup

Do not put real secret keys in `config.js`. GitHub Pages is public, so anything in `config.js` can be seen by anyone.

Use this setup instead:

```text
config.js
  EDGE_FUNCTION_URL only

Supabase Edge Function Secrets
  BREEZE_API_KEY
  BREEZE_SECRET_KEY
  BREEZE_ADMIN_PIN
  PROGRAM_ACCESS_TOKEN
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_TABLE

Supabase Database
  latest API_Session / access code

PC .env or GitHub Secrets for other programs
  EDGE_FUNCTION_URL
  PROGRAM_ACCESS_TOKEN
```

`BREEZE_SECRET_KEY` is not exposed to the browser. Trusted programs fetch it from the Edge Function by sending `PROGRAM_ACCESS_TOKEN`.

## Files

- `index.html` - GitHub Pages webpage.
- `app.js` - Calls the Supabase Edge Function.
- `config.js` - Public Edge Function URL only.
- `supabase/functions/breeze-token/index.ts` - Private backend function.
- `supabase.sql` - Database table and locked-down permissions.
- `breeze_credentials.py` - Helper for trusted Python programs to fetch all three Breeze values.

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
BREEZE_SECRET_KEY=your_real_breeze_secret_key
BREEZE_ADMIN_PIN=choose_your_private_pin
PROGRAM_ACCESS_TOKEN=choose_a_long_private_program_token
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_TABLE=breeze_access_codes
```

The admin PIN is what you will type on the webpage before opening the Breeze login link or saving the access code.

The program access token is what your PC code or GitHub Actions code will use to fetch:

```text
BREEZE_API_KEY
BREEZE_SECRET_KEY
latest API_Session / access code
```

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

## Use In PC Or GitHub Programs

Your trusted programs only need these two values:

```text
EDGE_FUNCTION_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/breeze-token
PROGRAM_ACCESS_TOKEN=your_private_program_token
```

On your PC, keep them in `.env`.

In GitHub Actions, keep them in GitHub repository secrets.

Then use:

```python
from breeze_credentials import get_breeze_credentials

credentials = get_breeze_credentials()

api_key = credentials["breeze_api_key"]
secret_key = credentials["breeze_secret_key"]
access_code = credentials["access_code"]
```

Or create a Breeze client directly:

```python
from breeze_credentials import create_breeze_client

breeze = create_breeze_client()
```

Do not print these values in logs.
