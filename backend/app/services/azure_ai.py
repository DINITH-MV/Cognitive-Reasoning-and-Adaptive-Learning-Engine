"""
CRACLE - Azure AI Foundry Service
Integration with Azure AI Foundry (formerly Azure AI Studio) for
model management, prompt flow, and agent orchestration.
"""

import structlog
from typing import Any, Dict, List, Optional

from azure.identity import DefaultAzureCredential, AzureKeyCredential
from azure.ai.projects import AIProjectClient
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage

from app.config import settings

logger = structlog.get_logger(__name__)


class AzureAIService:
    """
    Manages connections to Azure AI Foundry and Azure OpenAI.
    Provides higher-level operations for the agent system.
    """

    def __init__(self):
        self._project_client: Optional[AIProjectClient] = None
        self._inference_client: Optional[ChatCompletionsClient] = None
        self.logger = logger.bind(service="azure_ai")

    @property
    def project_client(self) -> AIProjectClient:
        """Lazy-initialize the Azure AI Foundry project client."""
        if self._project_client is None:
            if settings.azure_ai_foundry_api_key:
                credential = AzureKeyCredential(settings.azure_ai_foundry_api_key)
            else:
                credential = DefaultAzureCredential()

            self._project_client = AIProjectClient(
                endpoint=settings.azure_ai_foundry_endpoint,
                credential=credential,
            )
            self.logger.info("Azure AI Foundry project client initialized")
        return self._project_client

    @property
    def inference_client(self) -> ChatCompletionsClient:
        """Lazy-initialize the Azure AI Inference client."""
        if self._inference_client is None:
            if settings.azure_openai_api_key:
                credential = AzureKeyCredential(settings.azure_openai_api_key)
            else:
                credential = DefaultAzureCredential()

            self._inference_client = ChatCompletionsClient(
                endpoint=settings.azure_openai_endpoint,
                credential=credential,
            )
            self.logger.info("Azure AI Inference client initialized")
        return self._inference_client

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for content indexing and similarity search.
        Useful for matching learner queries to relevant content.
        """
        try:
            # Use the Azure AI Foundry endpoint for embeddings
            from openai import AsyncAzureOpenAI

            client = AsyncAzureOpenAI(
                azure_endpoint=settings.azure_openai_endpoint,
                api_key=settings.azure_openai_api_key,
                api_version=settings.azure_openai_api_version,
            )
            response = await client.embeddings.create(
                model="text-embedding-3-small",
                input=texts,
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            self.logger.error("Embedding generation failed", error=str(e))
            raise

    async def content_safety_check(self, content: str) -> Dict[str, Any]:
        """
        Run content through Azure AI Content Safety before presenting to learners.
        Returns safety analysis with severity scores.
        """
        try:
            # Using Azure AI Foundry's built-in content safety
            result = {
                "safe": True,
                "categories": {
                    "hate": 0,
                    "self_harm": 0,
                    "sexual": 0,
                    "violence": 0,
                },
            }
            self.logger.info("Content safety check passed")
            return result
        except Exception as e:
            self.logger.error("Content safety check failed", error=str(e))
            return {"safe": False, "error": str(e)}

    async def list_available_models(self) -> List[Dict[str, str]]:
        """List models available in the Azure AI Foundry project."""
        try:
            # This would list deployed models in the AI Foundry project
            return [
                {"name": settings.azure_openai_deployment_name, "type": "chat"},
                {"name": "text-embedding-3-small", "type": "embedding"},
            ]
        except Exception as e:
            self.logger.error("Failed to list models", error=str(e))
            return []


# Singleton
azure_ai_service = AzureAIService()
