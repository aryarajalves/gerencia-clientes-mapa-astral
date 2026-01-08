import asyncio
import sys
import os

# Adiciona o diretorio pai ao path para importar app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.baserow_client import baserow_client
from app.config import settings
import httpx
from datetime import datetime, timedelta

async def main():
    print("Iniciando Verificação de Entregas Atrasadas (> 2 Horas)...")
    
    # 1. Buscar todos os clientes da tabela 673
    # Podemos usar o baserow_client existente ou fazer request direto para ter controle total dos campos
    # Vamos usar request direto para ter certeza dos campos crus
    
    headers = {'Authorization': f'Token {settings.baserow_api_token}'}
    url = f"{settings.baserow_api_url}/api/database/rows/table/673/"
    
    async with httpx.AsyncClient() as client:
        # Paginacao... vamos pegar 200 por enquanto
        res = await client.get(
            url,
            headers=headers,
            params={"user_field_names": "true", "size": 200} 
        )
        
        if res.status_code != 200:
            print(f"Erro ao buscar tabela: {res.status_code}")
            return

        rows = res.json().get("results", [])
        print(f"Total analise: {len(rows)} contatos.")
        
        now = datetime.now()
        
        if rows:
            # print(f"Analise iniciada em {datetime.now()}")
             pass

        for row in rows:
            nome = row.get("Nome", "Sem Nome")
            
            # 1. Verifica flag "Nao Entregou e Passou 2 Horas" (Deve estar FALSE)
            # O usuario pediu: "verificando quem possue essa variavel como false"
            ja_foi_marcado_atraso = row.get("Nao Entregou e Passou 2 Horas")
            # Trata None como False se necessario, mas vamos garantir que se for True, pula
            if ja_foi_marcado_atraso is True:
                continue 
                
                
            # 2. Verifica se JA ENTREGOU (Se entregou, nao deve aparecer)
            # O usuario pediu: "verificar se essa variavel não é true: Ja Entregou Mapa Astral"
            ja_entregou = row.get("Ja Entregou Mapa Astral")
            if ja_entregou is True:
                continue
                
            # 3. Verifica Tempo (> 2 Horas)
            data_str = row.get("Data Entrou Em Contato") # YYYY-MM-DD
            hora_str = row.get("Horario Entrou Em Contato") # HH:MM or HH:MM:SS
            
            if not data_str or not hora_str:
                continue # Sem data/hora, nao da para calcular
                
            try:
                # Normaliza Hora (pode vir 02:42 ou 02:42:00)
                hora_clean = hora_str.strip()
                if len(hora_clean) == 5:
                    hora_clean += ":00"
                
                # Tenta parsear a data (Formatos provaveis: DD/MM/YY, DD/MM/YYYY, YYYY-MM-DD)
                data_clean = data_str.strip()
                dt_obj = None
                
                # 1. Tenta DD/MM/YY (Ex: 29/12/25)
                if "/" in data_clean:
                    parts = data_clean.split("/")
                    if len(parts) == 3:
                        dia, mes, ano = parts
                        if len(ano) == 2:
                            ano = f"20{ano}"
                        dt_obj = datetime.strptime(f"{ano}-{mes}-{dia} {hora_clean}", "%Y-%m-%d %H:%M:%S")
                
                # 2. Tenta YYYY-MM-DD (Fallback)
                if not dt_obj and "-" in data_clean:
                     dt_obj = datetime.strptime(f"{data_clean} {hora_clean}", "%Y-%m-%d %H:%M:%S")

                if not dt_obj:
                    continue

                # 4. Verifica se EH CLIENTE REAL (Se for lead, nao marca atraso)
                eh_cliente_real = row.get("E Um Cliente Real")
                if not eh_cliente_real:
                    continue

                # Check 2 horas
                diff = now - dt_obj
                hours_passed = diff.total_seconds() / 3600
                
                if hours_passed >= 2:
                    print(f"⚠️  Atualizando {nome} (Atraso: {int(hours_passed)}h)...")
                    
                    # Atualiza no Baserow
                    update_url = f"{settings.baserow_api_url}/api/database/rows/table/673/{row['id']}/"
                    payload = {"Nao Entregou e Passou 2 Horas": True}
                    
                    update_res = await client.patch(
                        update_url,
                        headers=headers,
                        json=payload,
                        params={"user_field_names": "true"}
                    )
                    
                    if update_res.status_code == 200:
                         print(f"✅  Sucesso: {nome} marcado como atrasado.")
                    else:
                         print(f"❌  Erro ao atualizar {nome}: {update_res.text}")

            except Exception as e:
                # print(f"Erro ao parsear data de {nome}: {e}")
                pass

if __name__ == "__main__":
    asyncio.run(main())
