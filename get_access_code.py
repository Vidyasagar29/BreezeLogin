import os
import sys
import requests

from env_loader import load_env


load_env()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://YOUR_PROJECT_REF.supabase.co")
SUPABASE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    os.getenv("SUPABASE_ANON_KEY", "YOUR_SUPABASE_KEY"),
)
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "breeze_access_codes")


def get_latest_access_code():
    url = f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}"
    params = {
        "select": "access_code,updated_at",
        "id": "eq.latest",
        "limit": "1",
    }
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

    response = requests.get(url, params=params, headers=headers, timeout=20)
    response.raise_for_status()
    rows = response.json()
    if not rows:
        raise RuntimeError("No Breeze access code found in Supabase.")

    return rows[0]["access_code"]


if __name__ == "__main__":
    try:
        print(get_latest_access_code())
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)
