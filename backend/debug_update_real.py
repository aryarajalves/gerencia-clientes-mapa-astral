
import asyncio
from app.baserow_client import BaserowClient
import json

async def test_update():
    client = BaserowClient()
    
    # 1. Pegar um cliente qualquer
    print("Buscando clientes...")
    clientes = await client.listar_clientes()
    if not clientes:
        print("Nenhum cliente encontrado para teste.")
        return

    target_cliente = clientes[0]
    id_cliente = target_cliente.id
    print(f"Testando com cliente ID: {id_cliente} - Nome: {target_cliente.nome}")
    print(f"Status Atual: {target_cliente.e_um_cliente_real}")

    # 2. Tentar atualizar para o oposto
    novo_status = not target_cliente.e_um_cliente_real
    print(f"Tentando atualizar para: {novo_status}")

    try:
        resultado = await client.atualizar_cliente(id_cliente, {"e_um_cliente_real": novo_status})
        print("Resultado do update:", resultado)
        
        # 3. Verificar se mudou lendo de novo
        # Pequeno delay para propagação se necessário (Baserow é rápido mas...)
        await asyncio.sleep(1)
        
        clientes_novos = await client.listar_clientes()
        cliente_atualizado = next((c for c in clientes_novos if c.id == id_cliente), None)
        
        if cliente_atualizado:
            print(f"Status Novo Lido do Banco: {cliente_atualizado.e_um_cliente_real}")
            if cliente_atualizado.e_um_cliente_real == novo_status:
                print("SUCESSO: O banco foi atualizado.")
            else:
                print("FALHA: O banco não persistiu a alteração.")
                
                # Vamos tentar ver os campos RAW do Baserow para descobrir o nome certo
                # Hack: vamos chamar a API direto para ver as chaves
                import httpx
                async with httpx.AsyncClient() as http:
                    resp = await http.get(
                        f"{client.base_url}/api/database/rows/table/{client.table_id}/{id_cliente}/?user_field_names=true",
                        headers=client.headers
                    )
                    print("\n--- DADOS RAW DO BASEROW ---")
                    print(json.dumps(resp.json(), indent=2))
        
    except Exception as e:
        print(f"Erro durante teste: {e}")

if __name__ == "__main__":
    asyncio.run(test_update())
