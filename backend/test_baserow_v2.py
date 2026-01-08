from app.baserow_client import baserow_client
import asyncio
from app.config import settings
import httpx

async def main():
    print(f'Testando conexao com tabela info: {settings.baserow_table_id_info}')
    try:
        # Busca direta na tabela info pelo numero
        headers = {'Authorization': f'Token {settings.baserow_api_token}'}
        async with httpx.AsyncClient() as client:
            # Busca pelo numero da Marta (ultimos 8 digitos)
            search_key = '3341317'  # Tentando chave mais curta
            print(f"Buscando chave: {search_key} na tabela 677")
            
            res = await client.get(
                f'{settings.baserow_api_url}/api/database/rows/table/677/',
                headers=headers,
                params={'user_field_names': 'true', 'search': search_key}
            )
            print(f'Status: {res.status_code}')
            print('Resultados:', res.json())

    except Exception as e:
        print(f'Erro: {e}')

if __name__ == '__main__':
    asyncio.run(main())
