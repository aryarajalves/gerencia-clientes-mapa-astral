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
    
    print(f"URL: {url}")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                inboxes = data.get("payload", [])
                print("LISTA DE INBOXES:")
                for inbox in inboxes:
                     print(f"ID: {inbox['id']} - NOME: {inbox['name']} - TIPO: {inbox['channel_type']}")
            else:
                print(f"ERRO: {response.text}")

        except Exception as e:
            print(f"EXCECAO: {str(e)}")

if __name__ == "__main__":
    asyncio.run(list_inboxes())
