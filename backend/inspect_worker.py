from app.baserow_client import baserow_client
import asyncio
from app.config import settings
import httpx

async def main():
    print(f'Inspecionando Tabela: 673')
    try:
        headers = {'Authorization': f'Token {settings.baserow_api_token}'}
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f'{settings.baserow_api_url}/api/database/fields/table/673/',
                headers=headers
            )
            if res.status_code == 200:
                fields = res.json()
                print("CAMPOS ENCONTRADOS:")
                for f in fields:
                    print(f"ID: {f['id']} | Nome: {f['name']} | Tipo: {f['type']}")
                
                # Vamos pegar uma linha de exemplo tambem
                res_rows = await client.get(
                    f'{settings.baserow_api_url}/api/database/rows/table/673/',
                    headers=headers,
                    params={'user_field_names': 'true', 'size': 1}
                )
                if res_rows.status_code == 200:
                    print("\nEXEMPLO DE LINHA:")
                    rows = res_rows.json()['results']
                    if rows:
                        print(rows[0])
            else:
                print(f'Erro ao buscar campos: {res.status_code} {res.text}')

    except Exception as e:
        print(f'Erro: {e}')

if __name__ == '__main__':
    asyncio.run(main())
