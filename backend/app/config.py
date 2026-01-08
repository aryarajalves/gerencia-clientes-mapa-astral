from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application Settings"""
    
    # Baserow
    baserow_api_url: str = "https://api.baserow.io"
    baserow_api_token: Optional[str] = None
    baserow_table_id: Optional[int] = None
    baserow_table_id_info: Optional[int] = None # ID Table Info
    baserow_table_usuarios_id: int = 678 # ID Table Users (Auth)
    
    # Server
    backend_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Chatwoot
    chatwoot_api_url: str = "https://app.chatwoot.com"
    chatwoot_api_token: Optional[str] = None
    chatwoot_account_id: Optional[str] = None
    chatwoot_inbox_id: Optional[str] = None
    chatwoot_message_delay: int = 3
    n8n_webhook_gerar_mapa_url: Optional[str] = None

    # WhatsApp Official API
    whatsapp_api_token: Optional[str] = None
    whatsapp_phone_number_id: Optional[str] = None
    whatsapp_business_account_id: Optional[str] = None

    # Sentry
    sentry_dsn: Optional[str] = None

    from pydantic import Field

    # Redis (Cache)
    redis_url_env: Optional[str] = Field(None, alias="REDIS_URL")
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: Optional[str] = None
    
    @property
    def redis_url(self) -> Optional[str]:
        """Mount Redis URL: Priority to REDIS_URL env, then build from host"""
        if self.redis_url_env:
            return self.redis_url_env
            
        if not self.redis_host:
            return None
        auth = f":{self.redis_password}@" if self.redis_password else ""
        return f"redis://{auth}{self.redis_host}:{self.redis_port}/{self.redis_db}"
    
    # Security (JWT)
    secret_key: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra vars
    
    def get_cors_origins(self) -> List[str]:
        """Return list of allowed CORS origins"""
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
