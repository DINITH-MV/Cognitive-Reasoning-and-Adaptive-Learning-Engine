"""
CRACLE - Cognitive Reasoning and Adaptive Learning Engine
Backend Application Configuration
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ---- App ----
    app_name: str = "CRACLE"
    app_version: str = "0.1.0"
    debug: bool = False
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_secret_key: str = "change-me"
    backend_cors_origins: str = '["http://localhost:3000"]'

    @property
    def cors_origins(self) -> List[str]:
        return json.loads(self.backend_cors_origins)

    # ---- Azure AI Foundry ----
    azure_ai_foundry_endpoint: str = ""
    azure_ai_foundry_api_key: str = ""
    azure_ai_foundry_project_name: str = "cracle-ai"
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment_name: str = "gpt-4o"
    azure_openai_api_version: str = "2024-12-01-preview"

    # ---- Azure Cosmos DB ----
    cosmos_db_endpoint: str = ""
    cosmos_db_key: str = ""
    cosmos_db_database: str = "cracle_db"

    # ---- Azure Storage ----
    azure_storage_connection_string: str = ""
    azure_storage_container: str = "cracle-content"

    # ---- Azure Application Insights ----
    appinsights_connection_string: str = ""

    # ---- Database ----
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cracle_db"

    # ---- Redis ----
    redis_url: str = "redis://localhost:6379/0"

    # ---- JWT ----
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
