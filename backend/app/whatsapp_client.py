import httpx
import json
import logging
import asyncio
from fastapi import UploadFile
from typing import Optional
from app.config import settings

# Configuração simples de log em arquivo
logging.basicConfig(
    filename='debug_chatwoot.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    encoding='utf-8'
)

def log_debug(msg):
    print(msg)
    logging.info(msg)

def log_error(msg):
    print(msg)
    logging.error(msg)

class ChatwootClient:
    def __init__(self):
        self.api_url = settings.chatwoot_api_url
        self.api_token = settings.chatwoot_api_token
        self.account_id = settings.chatwoot_account_id
        self.inbox_id = settings.chatwoot_inbox_id
        self.message_delay = settings.chatwoot_message_delay

    def _get_headers(self):
        return {
            "api_access_token": self.api_token,
            "Content-Type": "application/json"
        }

    async def _get_or_create_contact(self, nome: str, numero: str):
        # 1. Buscar contato existente
        if not numero.startswith('+'):
            numero = f"+{numero}"
            
        search_url = f"{self.api_url}/api/v1/accounts/{self.account_id}/contacts/search"
        log_debug(f"🔍 Chatwoot: Buscando contato {numero} na URL {search_url}")
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    search_url, 
                    params={"q": numero}, 
                    headers=self._get_headers()
                )
                data = response.json()
            except Exception as e:
                log_error(f"❌ Chatwoot: Erro ao buscar/decodificar: {str(e)}")
                raise e
            
            if data and data.get("payload") and len(data["payload"]) > 0:
                log_debug("✅ Chatwoot: Contato existente encontrado.")
                return data["payload"][0]
        
        # 2. Se não existir, criar
        create_url = f"{self.api_url}/api/v1/accounts/{self.account_id}/contacts"
        log_debug(f"🆕 Chatwoot: Criando novo contato {nome}...")
        
        payload = {
            "name": nome,
            "phone_number": numero,
            "inbox_id": self.inbox_id
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(create_url, json=payload, headers=self._get_headers())
            return response.json().get("payload", {}).get("contact")

    async def _create_conversation(self, contact_id: int):
        # 1. TENTAR BUSCAR CONVERSA EXISTENTE ABERTA
        conversations_url = f"{self.api_url}/api/v1/accounts/{self.account_id}/contacts/{contact_id}/conversations"
        
        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(conversations_url, headers=self._get_headers())
                if r.status_code == 200:
                    payload = r.json().get("payload", [])
                    for conv in payload:
                        if str(conv.get("inbox_id")) == str(self.inbox_id) and conv.get("status") == "open":
                            log_debug(f"✅ Chatwoot: Conversa aberta encontrada (ID: {conv['id']}). Reutilizando.")
                            return conv
            except Exception as e:
                log_error(f"⚠️ Chatwoot: Erro ao listar conversas: {e}")

        # 2. SE NÃO ACHOU, CRIA NOVA
        url = f"{self.api_url}/api/v1/accounts/{self.account_id}/conversations"
        payload = {
            "source_id": contact_id,
            "inbox_id": self.inbox_id
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self._get_headers())
            if response.status_code >= 400:
                 log_error(f"❌ Chatwoot: Erro ao criar conversa: {response.text}")
            return response.json()

    # Método auxiliar privado para enviar mensagem de texto simples
    async def _enviar_texto_direto(self, conversation_id: int, mensagem: str):
         message_url = f"{self.api_url}/api/v1/accounts/{self.account_id}/conversations/{conversation_id}/messages"
         payload = {
            "content": mensagem,
            "message_type": "outgoing",
            "private": False
         }
         log_debug(f"🚀 Chatwoot: Enviando TEXTO (Sequência) para conversa {conversation_id}...")
         async with httpx.AsyncClient() as client:
            r = await client.post(message_url, json=payload, headers=self._get_headers())
            r.raise_for_status()
            return r

    async def enviar_mensagem(self, nome: str, numero: str, mensagem: str):
        # Fluxo padrão de mensagem única
        return await self.enviar_arquivo(nome, numero, mensagem, None)

    async def enviar_arquivo(self, nome: str, numero: str, mensagem: str, arquivo: UploadFile = None, delay: Optional[int] = None):
        # LOGS DE DIAGNÓSTICO
        tipo = "ARQUIVO+TEXTO" if arquivo else "TEXTO"
        log_debug("="*50)
        log_debug(f"🛑 DIAGNÓSTICO DE ENVIO ({tipo})")
        
        if not self.api_token or not self.account_id or not self.inbox_id:
             log_error("❌ Chatwoot: Configuração ausente no .env")
             return {"error": "Chatwoot não configurado."}

        try:
            # 1. Contato e Conversa (Unificado)
            contact = await self._get_or_create_contact(nome, numero)
            if not contact:
                raise Exception("Falha ao obter contato no Chatwoot")
            
            contact_id = contact["id"]
            
            conversation_data = await self._create_conversation(contact_id)
            if not conversation_data or 'id' not in conversation_data:
                 raise Exception("Falha ao criar/obter conversa")
                 
            conversation_id = conversation_data["id"]
            log_debug(f"✅ Conversa Alvo ID: {conversation_id}")

            # 2. SEPARAR O ENVIO
            # Se tiver texto E arquivo, manda texto -> delay -> arquivo
            # Se só texto, manda texto
            # Se só arquivo, manda arquivo (mas nesse método 'mensagem' é obrigatório no frontend, então vira 'caption' se fosse junto)
            
            responses = []

            # Passo A: Enviar Texto (se houver)
            if mensagem and mensagem.strip():
                # Se tiver arquivo depois, manda como mensagem separada
                if arquivo:
                    log_debug("📤 Enviando Texto PRIMEIRO...")
                    resp_txt = await self._enviar_texto_direto(conversation_id, mensagem)
                    responses.append(resp_txt.json())
                    
                    # DELAY CONFIGURÁVEL
                    tempo_espera = delay if delay is not None else self.message_delay
                    log_debug(f"⏳ Aguardando delay de {tempo_espera} segundos...")
                    await asyncio.sleep(tempo_espera)
                else:
                    # Se NÃO tiver arquivo, envia normal (retorno único)
                    return (await self._enviar_texto_direto(conversation_id, mensagem)).json()

            # Passo B: Enviar Arquivo (se houver)
            if arquivo:
                log_debug("📤 Enviando Arquivo AGORA...")
                message_url = f"{self.api_url}/api/v1/accounts/{self.account_id}/conversations/{conversation_id}/messages"
                headers = {"api_access_token": self.api_token}
                
                conteudo = await arquivo.read()
                files = {'attachments[]': (arquivo.filename, conteudo, arquivo.content_type)}
                
                # Se já enviamos o texto antes, mandamos vazio aqui. 
                # Se não tinha texto, mandamos o conteúdo aqui (mas o if anterior garante envio separado)
                # Então aqui payload content é vazio ou a mensagem se fosse lógica unificada.
                # Como separamos: content=""
                
                data = {
                    "content": "", 
                    "message_type": "outgoing",
                    "private": "false"
                }

                async with httpx.AsyncClient() as client:
                    response = await client.post(message_url, data=data, files=files, headers=headers)
                    if response.status_code >= 400:
                        log_error(f"❌ Chatwoot Erro Upload: {response.text}")
                    response.raise_for_status()
                    responses.append(response.json())
                    log_debug("✅ Arquivo enviado!")

            return responses[-1] if responses else {"status": "ok"}

        except Exception as e:
            log_error(f"❌ Chatwoot Erro Geral: {e}")
            raise e

    async def enviar_template(self, nome: str, numero: str, template_name: str, language: str = "pt_BR"):
        """Envia um template do WhatsApp usando a API Oficial"""
        
        # Validação simples
        if not settings.whatsapp_api_token or not settings.whatsapp_phone_number_id:
             log_error("❌ WhatsApp API: Credenciais não configuradas (WHATSAPP_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID)")
             return {"error": "WhatsApp API Oficial não configurada."}

        url = f"https://graph.facebook.com/v19.0/{settings.whatsapp_phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {settings.whatsapp_api_token}",
            "Content-Type": "application/json"
        }

        # Formatação do número
        clean_number = "".join(filter(str.isdigit, numero))
        # Se não tiver código do país, assume 55? Melhor deixar o usuário garantir ou tratar básico
        # A API oficial exige código do país sem o '+'
        if not clean_number.startswith("55") and len(clean_number) <= 11:
             clean_number = "55" + clean_number
        
        payload = {
            "messaging_product": "whatsapp",
            "to": clean_number,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": language
                }
            }
        }
        
        log_debug(f"📤 WhatsApp API: Enviando template '{template_name}' para {clean_number}...")

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code >= 400:
                     log_error(f"❌ WhatsApp API Erro: {response.text}")
                     return {"error": f"Erro na API do WhatsApp: {response.text}", "status_code": response.status_code}
                
                log_debug("✅ WhatsApp API: Template enviado com sucesso!")
                return response.json()
            except Exception as e:
                log_error(f"❌ WhatsApp API Exception: {e}")
                raise e

    async def listar_templates(self):
        """Lista os templates disponíveis na conta do WhatsApp"""
        if not settings.whatsapp_api_token or not settings.whatsapp_business_account_id:
            log_debug("⚠️ WhatsApp API: WABA ID ou Token não configurados para listar templates.")
            return []

        url = f"https://graph.facebook.com/v19.0/{settings.whatsapp_business_account_id}/message_templates"
        
        headers = {
            "Authorization": f"Bearer {settings.whatsapp_api_token}",
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params={"limit": 100})
                if response.status_code == 200:
                    data = response.json()
                    templates = data.get("data", [])
                    # Filtra apenas aprovados
                    aprovados = [t for t in templates if t.get("status") == "APPROVED"]
                    return aprovados
                else:
                    log_error(f"❌ Erro ao listar templates: {response.text}")
                    return []
        except Exception as e:
            log_error(f"❌ Exceção ao listar templates: {str(e)}")
            return []

# Instância global do cliente
chatwoot_client = ChatwootClient()
