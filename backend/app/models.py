from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class ClienteBase(BaseModel):
    """Modelo base para cliente"""
    nome: str = Field(..., min_length=2, max_length=200, description="Nome completo do cliente", examples=["JoÃ£o Silva"])
    numero: Optional[str] = Field(None, max_length=20, description="NÃºmero de contato/WhatsApp", examples=["5511999999999"])
    email: Optional[EmailStr] = Field(None, description="Email do cliente", examples=["joao@email.com"])
    data_entrou_contato: Optional[str] = Field(None, description="Data que entrou em contato (YYYY-MM-DD)", examples=["2023-10-27"])
    horario_entrou_contato: Optional[str] = Field(None, description="HorÃ¡rio que entrou em contato (HH:MM)", examples=["14:30"])
    janela_24_horas: Optional[bool] = Field(default=False, description="Dentro da janela de 24 horas?", examples=[True])
    link_pdf_mapa_astral: Optional[str] = Field(None, description="Link do PDF do Mapa Astral", examples=["https://example.com/mapa.pdf"])
    ja_entregou_mapa: Optional[bool] = Field(default=False, description="Indica se o mapa jÃ¡ foi entregue", examples=[False])
    ultimo_horario_mensagens: Optional[str] = Field(None, description="Ãltimo horÃ¡rio que trocamos mensagens", examples=["2023-10-27T14:30:00"])
    e_um_cliente_real: Optional[bool] = Field(default=True, description="Indica se é um cliente real", examples=[True])
    nao_entregou_e_passou_2_horas: Optional[bool] = Field(default=False, description="Passou de 2 horas e não entregou", examples=[False])
    
    # Campos da tabela "Info"
    area_foco: Optional[str] = Field(None, description="Ãrea de Foco", examples=["Amor e Relacionamento"])
    data_nascimento: Optional[str] = Field(None, description="Data de Nascimento", examples=["1990-01-01"])
    horario_nascimento: Optional[str] = Field(None, description="HorÃ¡rio de Nascimento", examples=["12:00"])
    cidade: Optional[str] = Field(None, description="Cidade", examples=["SÃ£o Paulo"])
    estado: Optional[str] = Field(None, description="Estado", examples=["SP"])
    pais: Optional[str] = Field(None, description="PaÃ­s", examples=["Brasil"])
    motivacao: Optional[str] = Field(None, description="MotivaÃ§Ã£o", examples=["Autoconhecimento"])
    mudanca_vida: Optional[str] = Field(None, description="O que mudaria na vida", examples=["Carreira"])
    expectativa: Optional[str] = Field(None, description="Expectativa com o mapa", examples=["Clareza"])


class ClienteCreate(ClienteBase):
    """Modelo para criaÃ§Ã£o de cliente"""
    pass


class ClienteUpdate(BaseModel):
    """Modelo para atualizaÃ§Ã£o de cliente (todos campos opcionais)"""
    nome: Optional[str] = Field(None, min_length=2, max_length=200, examples=["JoÃ£o Silva Editado"])
    numero: Optional[str] = Field(None, max_length=20, examples=["5511988888888"])
    email: Optional[EmailStr] = Field(None, examples=["novoemail@email.com"])
    data_entrou_contato: Optional[str] = Field(None, examples=["2023-10-28"])
    horario_entrou_contato: Optional[str] = Field(None, examples=["15:00"])
    janela_24_horas: Optional[bool] = Field(None, examples=[True])

    ja_entregou_mapa: Optional[bool] = Field(None, examples=[True])
    link_pdf_mapa_astral: Optional[str] = Field(None, examples=["https://new-link.com/mapa.pdf"])
    e_um_cliente_real: Optional[bool] = Field(None, description="Indica se Ã© um cliente real", examples=[True])
    
    # Campos Info (Update)
    area_foco: Optional[str] = Field(None, examples=["Carreira"])
    data_nascimento: Optional[str] = Field(None, examples=["1995-05-05"])
    horario_nascimento: Optional[str] = Field(None, examples=["18:00"])
    cidade: Optional[str] = Field(None, examples=["Rio de Janeiro"])
    estado: Optional[str] = Field(None, examples=["RJ"])
    pais: Optional[str] = Field(None, examples=["Brasil"])
    motivacao: Optional[str] = Field(None, examples=["Curiosidade"])
    mudanca_vida: Optional[str] = Field(None, examples=["Relacionamento"])
    expectativa: Optional[str] = Field(None, examples=["OrientaÃ§Ã£o"])


class Cliente(ClienteBase):
    """Modelo completo do cliente com ID"""
    id: int = Field(..., description="ID do cliente no Baserow")
    
    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    """Modelo de resposta de erro"""
    detail: str
    error_code: Optional[str] = None


class SuccessResponse(BaseModel):
    """Modelo de resposta de sucesso"""
    message: str
    data: Optional[dict] = None


class LoginRequest(BaseModel):
    """Modelo para login"""
    email: EmailStr = Field(..., description="Email do usuário", examples=["admin@example.com"])
    password: str = Field(..., description="Senha do usuário", examples=["secret123"])


class Token(BaseModel):
    """Modelo de Token JWT"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Dados extraídos do Token"""
    email: Optional[str] = None

