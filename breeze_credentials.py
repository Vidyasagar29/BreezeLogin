import os
import sys
import requests

from env_loader import load_env


load_env()

EDGE_FUNCTION_URL = os.getenv(
    "EDGE_FUNCTION_URL",
    "https://YOUR_PROJECT_REF.supabase.co/functions/v1/breeze-token",
)
PROGRAM_ACCESS_TOKEN = os.getenv("PROGRAM_ACCESS_TOKEN", "YOUR_PROGRAM_ACCESS_TOKEN")


def get_breeze_credentials():
    response = requests.post(
        EDGE_FUNCTION_URL,
        json={"action": "get-credentials"},
        headers={
            "x-program-token": PROGRAM_ACCESS_TOKEN.strip(),
            "Content-Type": "application/json",
        },
        timeout=20,
    )

    if not response.ok:
        raise RuntimeError(f"{response.status_code} {response.text}")

    return response.json()


def create_breeze_client():
    from breeze_connect import BreezeConnect

    credentials = get_breeze_credentials()
    breeze = BreezeConnect(api_key=credentials["breeze_api_key"])
    breeze.generate_session(
        api_secret=credentials["breeze_secret_key"],
        session_token=credentials["access_code"],
    )
    return breeze


if __name__ == "__main__":
    try:
        credentials = get_breeze_credentials()
        print(f"Fetched Breeze credentials. Access code updated at: {credentials.get('updated_at')}")
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)
