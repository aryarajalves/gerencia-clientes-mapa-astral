import httpx
import asyncio
import os
import sys

# Garante que consegue importar app.config
sys.path.append(os.getcwd())

try:
    from app.config import settings
except ImportError:
    from dotenv import load_dotenv
    load_dotenv()
    class Settings:
        chatwoot_api_url = os.getenv("CHATWOOT_API_URL")
        chatwoot_api_token = os.getenv("CHATWOOT_API_TOKEN")
        chatwoot_account_id = os.getenv("CHATWOOT_ACCOUNT_ID")
    settings = Settings()

async def list_inboxes():
    url = f"{settings.chatwoot_api_url}/api/v1/accounts/{settings.chatwoot_account_id}/inboxes"
    headers = {
        "api_access_token": settings.chatwoot_api_token,
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=headers)
        for i in r.json().get("payload", []):
             print(f"INBOX_ID: {i['id']} - {i['name']}")

if __name__ == "__main__":
    asyncio.run(list_inboxes())
