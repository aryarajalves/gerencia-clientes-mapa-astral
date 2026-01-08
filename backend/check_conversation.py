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

async def find_conversation(phone_number):
    headers = {
        "api_access_token": settings.chatwoot_api_token,
        "Content-Type": "application/json"
    }
    
    # 1. Buscar Contato
    clean_number = phone_number.replace(" ", "")
    if not clean_number.startswith('+'):
        clean_number = f"+{clean_number}"
        
    print(f"🔍 Buscando contato para: {clean_number}...")
    
    search_url = f"{settings.chatwoot_api_url}/api/v1/accounts/{settings.chatwoot_account_id}/contacts/search"
    
    async with httpx.AsyncClient() as client:
        # Busca contato
        r_contact = await client.get(search_url, params={"q": clean_number}, headers=headers)
        if r_contact.status_code != 200:
            print(f"❌ Erro ao buscar contato: {r_contact.text}")
            return

        data_contact = r_contact.json()
        contacts = data_contact.get("payload", [])
        
        if not contacts:
            print("❌ Contato não encontrado.")
            return

        contact = contacts[0]
        contact_id = contact['id']
        print(f"✅ Contato Encontrado: {contact['name']} (ID: {contact_id})")
        
        # 2. Buscar Conversas do Contato
        conversations_url = f"{settings.chatwoot_api_url}/api/v1/accounts/{settings.chatwoot_account_id}/contacts/{contact_id}/conversations"
        r_conv = await client.get(conversations_url, headers=headers)
        
        if r_conv.status_code != 200:
             print(f"❌ Erro ao buscar conversas: {r_conv.text}")
             return
             
        conversations = r_conv.json().get("payload", [])
        
        if not conversations:
            print("⚠️ Nenhuma conversa encontrada para este contato.")
        else:
            print("\n📂 Conversas Encontradas:")
            for conv in conversations:
                print(f"🆔 ID da Conversa: {conv['id']}")
                print(f"   Status: {conv['status']}")
                print(f"   Inbox ID: {conv['inbox_id']}")
                print("-" * 30)

if __name__ == "__main__":
    # Número solicitado: 55 8596123586
    numero = "558596123586"
    asyncio.run(find_conversation(numero))
