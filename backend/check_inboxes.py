import httpx
import asyncio
import os
import sys

# Garante que consegue importar app.config
sys.path.append(os.getcwd())

try:
    from app.config import settings
except ImportError:
    # Fallback se rodar fora do contexto
    from dotenv import load_dotenv
    load_dotenv()
    class Settings:
        chatwoot_api_url = os.getenv("CHATWOOT_API_URL")
        chatwoot_api_token = os.getenv("CHATWOOT_API_TOKEN")
        chatwoot_account_id = os.getenv("CHATWOOT_ACCOUNT_ID")
    settings = Settings()

async def list_inboxes():
    if not settings.chatwoot_api_token:
        print("❌ Erro: CHATWOOT_API_TOKEN não encontrado no .env")
        return

    url = f"{settings.chatwoot_api_url}/api/v1/accounts/{settings.chatwoot_account_id}/inboxes"
    headers = {
        "api_access_token": settings.chatwoot_api_token,
        "Content-Type": "application/json"
    }
    
    print(f"🔍 Conectando ao Chatwoot em: {settings.chatwoot_api_url}")
    print(f"👤 Conta ID: {settings.chatwoot_account_id}")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            
            if response.status_code == 404:
                 print("❌ Erro 404: Conta não encontrada ou URL errada.")
                 return
            
            if response.status_code != 200:
                print(f"❌ Erro ao listar inboxes ({response.status_code}): {response.text}")
                return

            data = response.json()
            inboxes = data.get("payload", [])
            
            if not inboxes:
                print("⚠️ Nenhuma caixa de entrada encontrada nesta conta.")
                return

            print("\n✅ Caixas de Entrada Disponíveis:")
            print("="*60)
            for inbox in inboxes:
                 print(f"🆔 ID: {inbox['id']}")
                 print(f"📛 Nome: {inbox['name']}")
                 print(f"🔌 Tipo: {inbox['channel_type']}")
                 print("-" * 60)
                 
            print("\n👉 Copie o ID da caixa 'Website' ou 'Whatsapp' correta e atualize o CHATWOOT_INBOX_ID no seu .env")

        except Exception as e:
            print(f"❌ Exceção ao conectar: {str(e)}")

if __name__ == "__main__":
    asyncio.run(list_inboxes())
