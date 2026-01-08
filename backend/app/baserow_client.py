import httpx
import json
import redis.asyncio as redis
import asyncio
from typing import List, Optional, Dict, Any
from app.config import settings
from app.models import Cliente, ClienteCreate, ClienteUpdate, ClienteBase
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, before_sleep_log
import logging

logger = logging.getLogger(__name__)


class BaserowClient:
    """Cliente para interagir com a API do Baserow"""
    
    def __init__(self):
        self.base_url = settings.baserow_api_url
        self.api_token = settings.baserow_api_token
        self.table_id = settings.baserow_table_id
        self.table_id_info = settings.baserow_table_id_info
        self.table_usuarios_id = settings.baserow_table_usuarios_id
        
        # Redis Connection
        self.redis = None
        if settings.redis_url:
            try:
                # Timeouts curtos para evitar travamento se o Redis nao estiver local
                self.redis = redis.from_url(
                    settings.redis_url, 
                    decode_responses=True,
                    socket_connect_timeout=1, 
                    socket_timeout=1
                )
                print(f"Redis configurado: {settings.redis_url}")
            except Exception as e:
                print(f"Erro ao configurar Redis: {e}")

        # Verifica se esta configurado
        if not self.api_token or not self.table_id:
            self.configured = False
        else:
            self.configured = True
            
        self.headers = {
            "Authorization": f"Token {self.api_token}",
            "Content-Type": "application/json"
        }
    

    
    def _check_configured(self):
        """Verifica se o Baserow esta configurado"""
        if not self.configured:
            raise ValueError(
                "Baserow nao configurado! "
                "Configure BASEROW_API_TOKEN e BASEROW_TABLE_ID no arquivo .env"
            )
    
    def _get_table_url(self, row_id: Optional[int] = None) -> str:
        """Monta a URL da tabela"""
        base = f"{self.base_url}/api/database/rows/table/{self.table_id}/"
        if row_id:
            return f"{base}{row_id}/"
        return base
    
    def _map_to_baserow_fields(self, cliente_data: Dict[str, Any]) -> Dict[str, Any]:
        """Mapeia os campos do modelo para os campos do Baserow (ASCII ONLY)"""
        mapped = {}
        
        if "nome" in cliente_data and cliente_data["nome"] is not None:
            mapped["Nome"] = cliente_data["nome"]
        
        if "numero" in cliente_data and cliente_data["numero"] is not None:
            mapped["Numero"] = cliente_data["numero"]
        
        if "email" in cliente_data and cliente_data["email"] is not None:
            mapped["Email"] = cliente_data["email"]
        
        if "data_entrou_contato" in cliente_data and cliente_data["data_entrou_contato"] is not None:
            # Passa a data como string, sem conversao
            mapped["Data Entrou Em Contato"] = str(cliente_data["data_entrou_contato"])
        
        if "horario_entrou_contato" in cliente_data and cliente_data["horario_entrou_contato"] is not None:
            mapped["Horario Entrou Em Contato"] = cliente_data["horario_entrou_contato"]
        
        if "janela_24_horas" in cliente_data and cliente_data["janela_24_horas"] is not None:
            mapped["Janela de 24 Horas"] = cliente_data["janela_24_horas"]
            
        if "link_pdf_mapa_astral" in cliente_data and cliente_data["link_pdf_mapa_astral"] is not None:
            mapped["Link Pdf - Mapa Astral"] = cliente_data["link_pdf_mapa_astral"]
            
        if "ja_entregou_mapa" in cliente_data and cliente_data["ja_entregou_mapa"] is not None:
            mapped["Ja Entregou Mapa Astral"] = cliente_data["ja_entregou_mapa"]

        if "e_um_cliente_real" in cliente_data and cliente_data["e_um_cliente_real"] is not None:
            mapped["E Um Cliente Real"] = cliente_data["e_um_cliente_real"]
        
        return mapped
    
    def _map_from_baserow_fields(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Mapeia os campos do Baserow para o modelo"""
        return {
            "id": row.get("id"),
            "nome": row.get("Nome", ""),
            "numero": row.get("Numero") or None,
            "email": row.get("Email") or None,
            "data_entrou_contato": row.get("Data Entrou Em Contato"),
            "horario_entrou_contato": row.get("Horario Entrou Em Contato"),
            "janela_24_horas": row.get("Janela de 24 Horas", False),
            "link_pdf_mapa_astral": row.get("Link Pdf - Mapa Astral"),
            "ja_entregou_mapa": row.get("Ja Entregou Mapa Astral", False),
            "ultimo_horario_mensagens": row.get("Ultimo Horario Que Trocamos Mensagens"),
            "e_um_cliente_real": row.get("E Um Cliente Real", True),

            # Campos extras mapeados apenas se estiverem presentes (vindos do merge)
            "area_foco": row.get("Area Foco"),
            "data_nascimento": row.get("Data de Nascimento"),
            "horario_nascimento": row.get("Horario de Nascimento"),
            "cidade": row.get("Cidade"),
            "estado": row.get("Estado"),
            "pais": row.get("Pais"),
            "motivacao": row.get("O que te motivou a buscar seu Mapa Astral agora"),
            "mudanca_vida": row.get("Se pudesse mudar uma coisa na sua vida hoje, o que seria?"),
            "expectativa": row.get("O que voce espera descobrir atraves do seu Mapa Astral?")
        }

    async def _fetch_info_data(self) -> Dict[str, Dict[str, Any]]:
        """Busca dados da tabela secundaria e indexa pelos ultimos 8 digitos"""
        if not self.table_id_info:
            return {}
            
        async with httpx.AsyncClient() as client:
            # Paginacao pode ser necessaria se for muito grande, mas vamos simplificar
            response = await client.get(
                f"{self.base_url}/api/database/rows/table/{self.table_id_info}/",
                headers=self.headers,
                params={"user_field_names": "true", "size": 200} # Limite seguro para MVP
            )
            
            if response.status_code != 200:
                print(f"Erro ao buscar tabela info ({self.table_id_info}) status: {response.status_code}")
                return {}

            data = response.json()
            info_map = {}
            for row in data.get("results", []):
                key = self._get_search_key(row.get("Numero"))
                if key:
                    info_map[key] = row
            
            return info_map

    async def _invalidate_cache(self):
        """Invalidate the clients list cache"""
        if self.redis:
            try:
                await self.redis.delete("clientes_list_v2")
                logger.info("Cache invalidado com sucesso")
            except Exception as e:
                logger.error(f"Erro ao invalidar cache: {e}")

    def _merge_info(self, cliente_row: Dict[str, Any], info_map: Dict[str, Any]):
        """Mescla dados da tabela info no cliente se houver match de numero"""
        if not info_map:
            return
            
        key = self._get_search_key(cliente_row.get("Numero"))
        if not key:
            return
        
        info_row = info_map.get(key)
        if info_row:
            # Copia campos relevantes
            fields_to_copy = [
                "Area Foco", 
                "Data de Nascimento", 
                "Horario de Nascimento", 
                "Cidade", 
                "Estado", 
                "Pais", 
                "O que te motivou a buscar seu Mapa Astral agora",
                "Se pudesse mudar uma coisa na sua vida hoje, o que seria?",
                "O que voce espera descobrir atraves do seu Mapa Astral?"
            ]
            for field in fields_to_copy:
                if field in info_row:
                    cliente_row[field] = info_row[field]
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
        reraise=True
    )
    async def listar_clientes(self, skip_cache: bool = False) -> List[Cliente]:
        """Lista todos os clientes (com Cache Redis)"""
        self._check_configured()
        
        # 0. Se pediu para pular cache
        if skip_cache:
            print("Skip Cache solicitado: Buscando fresco...")
        
        # 1. Tenta buscar do Cache (se nao for skip)
        elif self.redis:
            try:
                cached_data = await self.redis.get("clientes_list_v2")
                if cached_data:
                    # Se achou no cache, desserializa e retorna
                    print("Cache Hit: Retornando clientes do Redis")
                    raw_list = json.loads(cached_data)
                    return [Cliente(**item) for item in raw_list]
            except Exception as e:
                print(f"Erro ao ler do Redis: {e}")
        
        # Se nao achou no cache ou pulou, busca do Baserow
        print("Cache Miss ou Skip: Buscando do Baserow...")
        
        # 2. Se nao achou, busca do Baserow (Em Paralelo)
        try:
             async with httpx.AsyncClient() as client:
                # Dispara buscar tabela principal e tabela info ao mesmo tempo
                task_main = client.get(
                    self._get_table_url(),
                    headers=self.headers,
                    params={"user_field_names": "true"}
                )
                task_info = self._fetch_info_data()

                # Aguarda ambos
                response_main, info_map = await asyncio.gather(task_main, task_info)
                
                response_main.raise_for_status()
                data = response_main.json()
                results = data.get("results", [])
                print(f"DEBUG BASEROW: Encontrados {len(results)} clientes na tabela principal.")

        except Exception as e:
            print(f"Erro na busca do Baserow: {e}")
            raise e

        clientes_para_cache = []
        clientes_objetos = []

        for row in data.get("results", []):
            # Tenta enriquecer com dados da tabela secundaria
            self._merge_info(row, info_map)
            
            cliente_data = self._map_from_baserow_fields(row)
            
            # Prepara para cache (dict) e retorno (Objeto)
            clientes_para_cache.append(cliente_data)
            clientes_objetos.append(Cliente(**cliente_data))
            
        print(f"Retornando {len(clientes_objetos)} clientes.")
        
        # 3. Salva no Cache (TTL 5 min = 300s)
        if self.redis:
            try:
                await self.redis.set("clientes_list_v2", json.dumps(clientes_para_cache, default=str), ex=300)
                print(f"Clientes salvos no Redis (TTL 300s)")
            except Exception as e:
                print(f"Erro ao salvar no Redis: {e}")
        
        return clientes_objetos
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
        reraise=True
    )
    async def buscar_cliente(self, cliente_id: int) -> Optional[Cliente]:
        """Busca um cliente por ID"""
        self._check_configured()
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self._get_table_url(cliente_id),
                headers=self.headers,
                params={"user_field_names": "true"}
            )
            
            if response.status_code == 404:
                return None
            
            response.raise_for_status()
            row = response.json()
            cliente_data = self._map_from_baserow_fields(row)
            return Cliente(**cliente_data)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
        reraise=True
    )
    async def criar_cliente(self, cliente: ClienteCreate) -> Cliente:
        """Cria um novo cliente"""
        self._check_configured()
        async with httpx.AsyncClient() as client:
            baserow_data = self._map_to_baserow_fields(cliente.model_dump())
            
            response = await client.post(
                self._get_table_url(),
                headers=self.headers,
                json=baserow_data,
                params={"user_field_names": "true"}
            )
            response.raise_for_status()
            row = response.json()
            cliente_data = self._map_from_baserow_fields(row)
            await self._invalidate_cache()
            return Cliente(**cliente_data)
    
    def _map_info_to_baserow(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Mapeia campos update para tabela Info (Incluindo strings vazias para limpar campos)"""
        mapped = {}
        mapping = {
            "area_foco": "Area Foco",
            "data_nascimento": "Data de Nascimento",
            "horario_nascimento": "Horario de Nascimento",
            "cidade": "Cidade",
            "estado": "Estado",
            "pais": "Pais",
            "motivacao": "O que te motivou a buscar seu Mapa Astral agora",
            "mudanca_vida": "Se pudesse mudar uma coisa na sua vida hoje, o que seria?",
            "expectativa": "O que voce espera descobrir atraves do seu Mapa Astral?"
        }
        for k, v in data.items():
            # Aceitamos strings vazias para permitir limpar o campo
            if k in mapping and v is not None:
                mapped[mapping[k]] = v
        return mapped
    
    def _get_search_key(self, numero: str) -> str:
        """Retorna os ultimos 8 digitos do numero somente se tiver pelo menos 8 digitos"""
        if not numero:
            return ""
        clean = "".join(filter(str.isdigit, str(numero)))
        if len(clean) >= 8:
            return clean[-8:]
        return clean
        
    async def _update_secondary_table(self, numero: str, info_data: Dict[str, Any], nome: str = None, email: str = None):
        """Atualiza tabela secundaria buscando pelos ultimos 8 digitos do numero"""
        if not self.table_id_info or not numero:
            return

        search_key = self._get_search_key(numero)
        if not search_key:
            return

        # Busca a linha correspondente na tabela info
        async with httpx.AsyncClient() as client:
            # 1. Buscar usando search com os ultimos 8 digitos
            response = await client.get(
                f"{self.base_url}/api/database/rows/table/{self.table_id_info}/",
                headers=self.headers,
                params={
                    "user_field_names": "true",
                    "search": search_key
                }
            )
            
            if response.status_code != 200:
                print(f"Erro busca info update: {response.text}")
                return

            results = response.json().get("results", [])
            target_row_id = None
            
            # Verifica qual resultado contem nossa chave nos ultimos digitos
            for row in results:
                row_key = self._get_search_key(row.get("Numero"))
                # Se a chave de busca (last 8 do cliente) estiver contida ou igual a chave da linha
                if row_key == search_key:
                    target_row_id = row["id"]
                    break
            
            if target_row_id:
                # 2. Update
                baserow_payload = self._map_info_to_baserow(info_data)
                
                # Opcional: Atualizar nome e email se fornecidos
                if nome:
                    baserow_payload["Nome"] = nome
                if email:
                    baserow_payload["Email"] = email
                    
                if baserow_payload:
                    await client.patch(
                        f"{self.base_url}/api/database/rows/table/{self.table_id_info}/{target_row_id}/",
                        headers=self.headers,
                        json=baserow_payload,
                        params={"user_field_names": "true"}
                    )
            else:
                # 3. Create (Se nao achou, cria nova linha com numero e infos)
                baserow_payload = self._map_info_to_baserow(info_data)
                baserow_payload["Numero"] = numero # Adiciona o link
                if nome:
                    baserow_payload["Nome"] = nome
                if email:
                    baserow_payload["Email"] = email
                
                await client.post(
                    f"{self.base_url}/api/database/rows/table/{self.table_id_info}/",
                    headers=self.headers,
                    json=baserow_payload,
                    params={"user_field_names": "true"}
                )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
        reraise=True
    )
    async def atualizar_cliente(self, cliente_id: int, cliente: ClienteUpdate) -> Optional[Cliente]:
        """Atualiza um cliente existente e seus dados extras"""
        self._check_configured()
        async with httpx.AsyncClient() as client:
            # Separa dados
            all_data = cliente.model_dump()
            
            # Dados Primarios
            primary_keys = ClienteBase.model_fields.keys()
            primary_data = {k: v for k, v in all_data.items() if k in primary_keys and v is not None}
            
            # Dados Secundarios (Info)
            info_keys = [
                "area_foco", "data_nascimento", "horario_nascimento", 
                "cidade", "estado", "pais", 
                "motivacao", "mudanca_vida", "expectativa"
            ]
            info_data = {k: v for k, v in all_data.items() if k in info_keys and v is not None}

            # 1. Atualiza Tabela Principal
            if primary_data:
                baserow_data = self._map_to_baserow_fields(primary_data)
                print(f"DEBUG: Atualizando Baserow Cliente {cliente_id}: {baserow_data}")
                response = await client.patch(
                    self._get_table_url(cliente_id),
                    headers=self.headers,
                    json=baserow_data,
                    params={"user_field_names": "true"}
                )
                
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                
            # 2. Se houver dados info, tenta atualizar tabela 2
            if info_data:
                # Precisamos do numero para linkar. 
                # Se veio no update, usa. Se nao, busca do cliente atual (poderia otimizar)
                numero = primary_data.get("numero")
                nome = primary_data.get("nome")
                email = primary_data.get("email")

                # Se faltar identificadores essenciais, busca cliente atual
                if not numero or not nome:
                    # Busca cliente atual para pegar numero/nome
                    current = await self.buscar_cliente(cliente_id)
                    if current:
                        if not numero:
                            numero = current.numero
                        if not nome:
                            nome = current.nome
                        if not email: # Email e opcional mas bom ter
                            email = current.email
                
                if numero:
                    await self._update_secondary_table(numero, info_data, nome, email)

            # Retorna cliente atualizado (com tudo)
            await self._invalidate_cache()
            return await self.buscar_cliente(cliente_id)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
        reraise=True
    )
    async def deletar_cliente(self, cliente_id: int) -> bool:
        """Deleta um cliente"""
        self._check_configured()
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                self._get_table_url(cliente_id),
                headers=self.headers
            )
            
            if response.status_code == 404:
                return False
            
            response.raise_for_status()
            await self._invalidate_cache()
            return True
    
    async def filtrar_por_janela_24h(self, dentro_janela: bool) -> List[Cliente]:
        """Filtra clientes por janela de 24 horas"""
        self._check_configured()
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self._get_table_url(),
                headers=self.headers,
                params={
                    "user_field_names": "true",
                    "filter__Janela de 24 Horas__boolean": "true" if dentro_janela else "false"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            clientes = []
            for row in data.get("results", []):
                cliente_data = self._map_from_baserow_fields(row)
                clientes.append(Cliente(**cliente_data))
            
            return clientes

    async def autenticar_usuario(self, email: str, senha: str) -> Optional[Dict[str, Any]]:
        """Autentica usuario verificando Email e Senha na tabela de usuarios"""
        if not self.table_usuarios_id:
            print("Tabela de usuarios nao configurada")
            return None
            
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/database/rows/table/{self.table_usuarios_id}/",
                    headers=self.headers,
                    params={
                        "user_field_names": "true",
                        "filter__field_Email__equal": email
                    }
                )
                
                if response.status_code != 200:
                    print(f"Erro ao buscar usuario: {response.text}")
                    return None
                    
                data = response.json()
                results = data.get("results", [])
                
                if not results:
                    return None
                    
                # Itera sobre todos os resultados encontrados (caso haja duplicatas de email)
                for usuario in results:
                    senha_banco = usuario.get("Senha")
                    
                    # Comparacao Simples
                    if senha_banco == senha:
                        return {
                            "id": usuario.get("id"),
                            "email": usuario.get("Email"),
                            "name": usuario.get("Nome", "Usuario")
                        }
                    
                return None
                
            except Exception as e:
                print(f"Erro de conexao ao autenticar: {e}")
                return None

    async def buscar_usuario_por_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Busca usuário pelo email (sem senha)"""
        if not self.table_usuarios_id:
            return None
            
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/database/rows/table/{self.table_usuarios_id}/",
                    headers=self.headers,
                    params={
                        "user_field_names": "true",
                        "filter__field_Email__equal": email
                    }
                )
                
                if response.status_code != 200:
                    return None
                    
                data = response.json()
                results = data.get("results", [])
                
                if results:
                    usuario = results[0]
                    return {
                        "id": usuario.get("id"),
                        "email": usuario.get("Email"),
                        "name": usuario.get("Nome", "Usuario")
                    }
                return None
            except Exception:
                return None


# Instancia global do cliente
baserow_client = BaserowClient()
