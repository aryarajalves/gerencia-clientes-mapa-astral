from fastapi import FastAPI, HTTPException, Form, File, UploadFile, Path, Body, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import timedelta
from .models import Cliente, ClienteCreate, ClienteUpdate, LoginRequest, SuccessResponse, Token, TokenData
from .baserow_client import baserow_client
from .whatsapp_client import chatwoot_client
from .auth import create_access_token, get_current_user
import httpx
from app.config import settings

# Imports Rate Limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# ConfiguraÃ§Ã£o do Rate Limiter (50 req/min por IP)
limiter = Limiter(key_func=get_remote_address, default_limits=["50/minute"])

import sentry_sdk

# Configuração do Sentry
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

app = FastAPI(
    title="Gerenciador de Clientes - Mapa Astral",
    description="API para gerenciamento de clientes, mapas astrais e automaÃ§Ã£o com WhatsApp/Chatwoot.",
    version="1.0.3",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Adiciona o estado do limiter ao app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware) # Adiciona middleware do SlowAPI

@app.on_event("startup")
async def startup_event():
    print("ð SERVIDOR INICIADO COM SUCESSO! ð")

# Configurar CORS
origins = settings.get_cors_origins()
# Adiciona porta 5174 manualmente caso backend esteja rodando em porta alternativa ou testes
origins.append("http://localhost:5174") 

print(f"ð CORS Origins configurados: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas de Clientes (CRUD)

@app.get("/api/clientes", response_model=List[Cliente], tags=["Clientes"])
async def listar_clientes(
    skip_cache: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    Lista todos os clientes cadastrados.
    
    - **Retorna**: Lista de objetos Cliente.
    - **Cache**: Utiliza Redis para cache (TTL 5 min).
    - **skip_cache**: Se True, ignora o cache e busca fresco do Baserow.
    """
    return await baserow_client.listar_clientes(skip_cache=skip_cache)

@app.get("/api/clientes/{cliente_id}", response_model=Cliente, tags=["Clientes"])
async def buscar_cliente(
    cliente_id: int = Path(..., title="ID do Cliente", description="ID único do cliente no Baserow"),
    current_user: dict = Depends(get_current_user)
):
    """
    Busca um cliente especÃ­fico pelo ID.
    """
    cliente = await baserow_client.buscar_cliente(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente nÃ£o encontrado")
    return cliente

@app.post("/api/clientes", response_model=Cliente, status_code=201, tags=["Clientes"])
async def criar_cliente(
    cliente: ClienteCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Cria um novo cliente no Baserow.
    
    - **Invalida Cache**: A lista de clientes serÃ¡ invalidada no cache.
    """
    return await baserow_client.criar_cliente(cliente)

@app.put("/api/clientes/{cliente_id}", response_model=Cliente, tags=["Clientes"])
async def atualizar_cliente(
    cliente_id: int = Path(..., title="ID do Cliente"),
    cliente: ClienteUpdate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza dados de um cliente existente.
    Suporta atualizaÃ§Ã£o parcial (apenas campos enviados).
    """
    atualizado = await baserow_client.atualizar_cliente(cliente_id, cliente)
    if not atualizado:
        raise HTTPException(status_code=404, detail="Cliente nÃ£o encontrado")
    return atualizado

@app.delete("/api/clientes/{cliente_id}", status_code=204, tags=["Clientes"])
async def deletar_cliente(
    cliente_id: int = Path(..., title="ID do Cliente"),
    current_user: dict = Depends(get_current_user)
):
    """
    Remove definitivamente um cliente.
    """
    sucesso = await baserow_client.deletar_cliente(cliente_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Cliente nÃ£o encontrado")
    return None


class MemoryUploadFile:
    def __init__(self, filename, content, content_type):
        self.filename = filename
        self.content = content
        self.content_type = content_type
    
    async def read(self):
        return self.content

    async def seek(self, position):
        pass # Simula seek para compatibilidade com a lÃ³gica de reset no client

# Endpoints Especiais

@app.post("/api/clientes/enviar-mensagem", tags=["Mensagens"])
async def enviar_mensagem(
    nome: str = Form(..., description="Nome do destinatário"),
    numero: str = Form(..., description="Número do WhatsApp com DDD"),
    mensagem: Optional[str] = Form(None, description="Conteúdo da mensagem de texto"),
    delay: Optional[int] = Form(None, description="Tempo de espera em segundos"),
    arquivo: Optional[UploadFile] = File(None, description="Arquivo para envio (opcional)"),
    link_pdf: Optional[str] = Form(None, description="Link do PDF para download e envio (opcional)"),
    template: Optional[str] = Form(None, description="Nome do template do WhatsApp (opcional)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Envia mensagem via Chatwoot (WhatsApp) ou Template Oficial.
    
    Permite enviar:
    - Apenas texto
    - Arquivo (Upload)
    - Arquivo (Download via URL)
    - Template WhatsApp Business API
    """
    try:
        clean_numero = numero.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        
        # 1. Fluxo de Template (API Oficial)
        if template:
            print(f"Enviando Template '{template}' para {nome} ({clean_numero})")
            return await chatwoot_client.enviar_template(nome, clean_numero, template)

        # 2. Fluxo PadrÃ£o (Chatwoot)
        if not mensagem and not arquivo and not link_pdf:
             raise HTTPException(status_code=400, detail="Mensagem, arquivo, link ou template obrigatÃ³rios")

        arquivo_para_enviar = arquivo

        # Se nÃ£o tem arquivo fÃ­sico mas tem link, baixa o PDF
        if not arquivo_para_enviar and link_pdf:
            # Tratamento para Google Docs (vÃira HTML se nÃ£o usar /export?format=pdf) asd 
            if "docs.google.com/document/d/" in link_pdf:
                if "/edit" in link_pdf:
                    link_pdf = link_pdf.split("/edit")[0]
                if not "export?format=pdf" in link_pdf:
                    # Garante que nÃ£o tenha barra no final antes de adicionar
                    link_pdf = link_pdf.rstrip("/") + "/export?format=pdf"
            
            print(f"Baixando PDF via URL: {link_pdf}")
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            async with httpx.AsyncClient(follow_redirects=True) as client:
                r = await client.get(link_pdf, headers=headers, timeout=60.0)
                print(f"DEBUG: Download Status: {r.status_code}")
                print(f"DEBUG: Content-Type recebido: {r.headers.get('content-type')}")
                print(f"DEBUG: Primeiros 100 bytes: {r.content[:100]}")
                
                if r.status_code == 200:
                    content = r.content
                    if not content.startswith(b'%PDF'):
                         print("⚠️ ATENÇÃO: O arquivo baixado NÃO parece ser um PDF válido (Header incorreto).")
                         # Não vou barrar, mas vou avisar no log.
                         # Pode ser que o Google entregue HTML pedindo login.
                    
                    arquivo_para_enviar = MemoryUploadFile("mapa_astral.pdf", content, "application/pdf")
                    print(f"✅ PDF Baixado com sucesso. Tamanho: {len(content)} bytes.")
                else:
                    print(f"❌ Falha ao baixar PDF do link: {r.status_code}")

        if arquivo_para_enviar:
            print(f"Enviando arquivo via Chatwoot para {nome} ({clean_numero}) com delay {delay}")
            msg_content = mensagem if mensagem else "" # Garante string
            return await chatwoot_client.enviar_arquivo(nome, clean_numero, msg_content, arquivo_para_enviar, delay=delay)
        else:
            print(f"Enviando texto via Chatwoot para {nome} ({clean_numero})")
            if not mensagem:
                 raise HTTPException(status_code=400, detail="Mensagem de texto obrigatÃ³ria")
            return await chatwoot_client.enviar_mensagem(nome, clean_numero, mensagem)
    except Exception as e:
        print(f"Erro no endpoint enviar-mensagem: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/clientes/{cliente_id}/gerar-mapa", tags=["Automação"])
async def gerar_mapa(
    cliente_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Dispara webhook do N8N para gerar o Mapa Astral.
    """
    cliente = await baserow_client.buscar_cliente(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente nÃ£o encontrado")
    
    webhook_url = settings.n8n_webhook_gerar_mapa_url
    print(f"DEBUG: URL crua: {webhook_url}")
    print(f"DEBUG: Repr URL: {repr(webhook_url)}")
    
    if webhook_url:
        webhook_url = webhook_url.strip() # Remove espaÃ§os e quebras de linha por seguranÃ§a
    
    print(f"DEBUG: URL ajustada: {repr(webhook_url)}")
    
    if not webhook_url:
        raise HTTPException(status_code=500, detail="Webhook N8N nÃ£o configurado")
        
    try:
        # Envia todos os dados do cliente
        payload = cliente.model_dump()
        async with httpx.AsyncClient(verify=False) as client:
            # Timeout generoso de 10 minutos (600s) para o N8N processar
            print(f"DEBUG: Enviando payload para N8N: {payload}")
            response = await client.post(webhook_url, json=payload, timeout=600.0)
            print(f"DEBUG: Resposta N8N: Status {response.status_code} | Body {response.text}")
            
            if response.status_code >= 400:
                 raise HTTPException(status_code=response.status_code, detail=f"Erro N8N: {response.text}")
            
            return {"status": "success", "message": "SolicitaÃ§Ã£o enviada para geraÃ§Ã£o do mapa"}
    except Exception as e:
        print(f"Erro ao disparar webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/whatsapp/templates", tags=["Mensagens"])
async def listar_templates_whatsapp(current_user: dict = Depends(get_current_user)):
    """
    Lista todos os templates aprovados na conta do WhatsApp Business API.
    """
    return await chatwoot_client.listar_templates()

@app.get("/api/health", tags=["Sistema"])
async def health_check():
    """Verifica se a API estÃ¡ online."""
    return {"status": "ok"}

# Reload Trigger to refresh env vars



@app.post("/api/login", response_model=Token, tags=["Autenticação"])
async def login(login_data: LoginRequest):
    """
    Autentica usuário com Email e Senha via Baserow e retorna JWT.
    """
    user = await baserow_client.autenticar_usuario(login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
        
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/users/me", response_model=SuccessResponse, tags=["Autenticação"])
async def read_users_me(current_user: TokenData = Depends(get_current_user)):
    """
    Retorna os dados do usuário logado.
    """
    user = await baserow_client.buscar_usuario_por_email(current_user.email)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {
        "message": "Dados do usuário recuperados",
        "data": user
    }

