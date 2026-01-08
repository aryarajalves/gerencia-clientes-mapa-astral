import asyncio
import httpx
from app.baserow_client import baserow_client

async def diagnose_user_2():
    print("--- DIAGNOSTICO USUARIO 2 ---")
    email_alvo = "aryarajmarketing@gmail.com"
    senha_alvo = "ary@2026"  # O que voce esta digitando

    print(f"Buscando na tabela {baserow_client.table_usuarios_id}...")

    # 1. Listar TODOS os usuarios (sem filtro) para ver o que tem la de verdade
    async with httpx.AsyncClient() as client:
        url = baserow_client._get_table_url().replace(str(baserow_client.table_id), str(baserow_client.table_usuarios_id))
        
        # Correcao: baserow_client usa self.base_url... vou usar a URL montada manualmente para garantir
        url = f"{baserow_client.base_url}/api/database/rows/table/{baserow_client.table_usuarios_id}/"

        resp = await client.get(
            url,
            headers=baserow_client.headers,
            params={"user_field_names": "true"}
        )
        
        if resp.status_code != 200:
            print(f"Erro ao ler tabela: {resp.text}")
            return

        usuarios = resp.json().get("results", [])
        print(f"Total de usuarios encontrados: {len(usuarios)}")
        
        found = False
        for u in usuarios:
            email_banco = u.get("Email", "")
            senha_banco = u.get("Senha", "")
            
            # Print usando repr() para mostrar aspas e caracteres invisiveis
            print(f"\nVerificando linha ID {u.get('id')}:")
            print(f"  Email no Banco: {repr(email_banco)}")
            print(f"  Senha no Banco: {repr(senha_banco)}")
            
            # Checa se eh o nosso alvo (mesmo com espacos)
            if email_alvo in email_banco:
                found = True
                print("  -> ESTE PARECE SER O USUARIO ALVO!")
                
                # Diagnostico de Email
                if email_banco != email_alvo:
                    print(f"  [!] ATENCAO: O email no banco tem diferencas!")
                    print(f"      Esperado: '{email_alvo}'")
                    print(f"      No Banco: '{email_banco}'")
                    if email_banco.strip() == email_alvo:
                        print("      DICA: Tem espacos em branco antes ou depois no Baserow!")
                else:
                    print("  [OK] Email bate exatamente.")

                # Diagnostico de Senha
                if senha_banco != senha_alvo:
                    print(f"  [!] ATENCAO: A senha nao confere!")
                    print(f"      Esperada (Input): '{senha_alvo}'")
                    print(f"      No Banco (Real):  '{senha_banco}'")
                    if senha_banco.strip() == senha_alvo:
                         print("      DICA: A senha no Baserow tem espacos em branco!")
                else:
                    print("  [OK] Senha confere.")

        if not found:
            print(f"\n[!] Nao encontrei nenhuma linha contendo '{email_alvo}'.")

if __name__ == "__main__":
    asyncio.run(diagnose_user_2())
