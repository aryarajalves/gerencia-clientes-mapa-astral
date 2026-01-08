import asyncio
import httpx
from app.baserow_client import baserow_client

async def verify_filter():
    email = "aryarajmarketing@gmail.com"
    print(f"Testando filtro API Baserow para: {email}")
    
    async with httpx.AsyncClient() as client:
        url = f"{baserow_client.base_url}/api/database/rows/table/{baserow_client.table_usuarios_id}/"
        params = {
            "user_field_names": "true",
            "filter__field_Email__equal": email
        }
        print(f"URL: {url}")
        print(f"Params: {params}")
        
        resp = await client.get(url, headers=baserow_client.headers, params=params)
        
        if resp.status_code == 200:
            data = resp.json()
            count = data.get("count", 0)
            results = data.get("results", [])
            print(f"Status 200 OK. Count: {count}")
            print(f"Results len: {len(results)}")
            if len(results) > 0:
                print("SUCESSO: O filtro encontrou o usuario.")
            else:
                print("FALHA: O filtro retornou lista vazia! O Baserow nao esta casando o email.")
        else:
            print(f"Erro {resp.status_code}: {resp.text}")

if __name__ == "__main__":
    asyncio.run(verify_filter())
