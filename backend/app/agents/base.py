"""
CRACLE - Base Agent class for all AI agents
Provides common Azure AI Foundry integration, logging, and monitoring.
"""

import time
import uuid
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

import structlog
from openai import AsyncAzureOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.evaluation import AgentInteraction

logger = structlog.get_logger(__name__)


def convert_uuids_to_strings(obj: Any) -> Any:
    """Recursively convert UUID objects to strings for JSON serialization."""
    if isinstance(obj, uuid.UUID):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_uuids_to_strings(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_uuids_to_strings(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_uuids_to_strings(item) for item in obj)
    return obj


class BaseAgent(ABC):
    """
    Abstract base class for all CRACLE agents.
    Provides:
    - Azure OpenAI client initialization
    - Structured logging
    - Interaction tracking for monitoring
    - Common LLM call wrapper with retry/error handling
    """

    def __init__(self, name: str, system_prompt: str):
        self.name = name
        self.system_prompt = system_prompt
        self.client = AsyncAzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )
        self.model = settings.azure_openai_deployment_name
        self.logger = logger.bind(agent=name)

    async def call_llm(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        response_format: Optional[dict] = None,
        tools: Optional[list] = None,
    ) -> Dict[str, Any]:
        """
        Make a call to Azure OpenAI with monitoring and error handling.
        Returns the parsed response along with usage metadata.
        """
        start_time = time.time()

        full_messages = [{"role": "system", "content": self.system_prompt}] + messages

        try:
            kwargs = {
                "model": self.model,
                "messages": full_messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if response_format:
                kwargs["response_format"] = response_format
            if tools:
                kwargs["tools"] = tools

            response = await self.client.chat.completions.create(**kwargs)

            latency_ms = int((time.time() - start_time) * 1000)
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }

            self.logger.info(
                "LLM call completed",
                latency_ms=latency_ms,
                tokens=usage["total_tokens"],
            )

            return {
                "content": response.choices[0].message.content,
                "tool_calls": response.choices[0].message.tool_calls,
                "usage": usage,
                "latency_ms": latency_ms,
                "finish_reason": response.choices[0].finish_reason,
            }

        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            self.logger.error("LLM call failed", error=str(e), latency_ms=latency_ms)
            raise

    async def log_interaction(
        self,
        db: AsyncSession,
        action: str,
        input_data: dict,
        output_data: dict,
        status: str = "success",
        latency_ms: int = 0,
        token_usage: dict = None,
        user_id: uuid.UUID = None,
        error_message: str = None,
    ):
        """Record agent interaction in the database for monitoring."""
        # Convert UUIDs to strings for JSON serialization
        input_data_clean = convert_uuids_to_strings(input_data)
        output_data_clean = convert_uuids_to_strings(output_data)
        token_usage_clean = convert_uuids_to_strings(token_usage or {})
        
        interaction = AgentInteraction(
            user_id=user_id,
            agent_name=self.name,
            action=action,
            input_data=input_data_clean,
            output_data=output_data_clean,
            status=status,
            latency_ms=latency_ms,
            token_usage=token_usage_clean,
            error_message=error_message,
        )
        db.add(interaction)
        await db.flush()
        return interaction

    @abstractmethod
    async def execute(self, context: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """
        Execute the agent's primary task.
        Each agent must implement this method.
        """
        pass
