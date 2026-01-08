import asyncio
import httpx
from app.baserow_client import baserow_client

async def look_for_duplicates():
    email_alvo = "aryarajmarketing@gmail.com"
    print(f"--- PROCURANDO DUPLICATAS PARA: {email_alvo} ---")
    
    async with httpx.AsyncClient() as client:
        # Busca FILTRADA para ver o que o login ve
        url = f"{baserow_client.base_url}/api/database/rows/table/{baserow_client.table_usuarios_id}/"
        params = {
            "user_field_names": "true",
            "filter__field_Email__equal": email_alvo
        }
        resp = await client.get(url, headers=baserow_client.headers, params=params)
        data = resp.json()
        results = data.get("results", [])
        
        print(f"Total encontrado pelo filtro: {len(results)}")
        
        for i, u in enumerate(results):
            print(f"Resultado #{i+1}:")
            print(f"  ID: {u.get('id')}")
            print(f"  Email: {repr(u.get('Email'))}")
            print(f"  Senha: {repr(u.get('Senha'))}")
            
        if len(results) > 1:
            print("\n[!] ALERTA: Multiplas contas com mesmo email!")
            print("    O sistema tenta logar com a PRIMEIRA.")
            print("    Se a senha da primeira estiver errada, o login falha.")

if __name__ == "__main__":
    asyncio.run(look_for_duplicates())
