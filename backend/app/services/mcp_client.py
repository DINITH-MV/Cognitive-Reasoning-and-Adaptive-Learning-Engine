"""
CRACLE - MCP (Model Context Protocol) Client
Integrates with external tools and data sources via MCP to enhance agent capabilities.
"""

import json
import structlog
from typing import Any, Dict, List, Optional

from mcp import ClientSession
from mcp.client.stdio import stdio_client, StdioServerParameters

from app.config import settings

logger = structlog.get_logger(__name__)


class MCPToolRegistry:
    """
    Registry of available MCP tools that agents can use.
    Each tool represents an external capability (web search, database queries,
    document retrieval, code execution, etc.).
    """

    def __init__(self):
        self.tools: Dict[str, Dict[str, Any]] = {}
        self.sessions: Dict[str, ClientSession] = {}
        self.logger = logger.bind(service="mcp")

    def register_tool(self, name: str, description: str, server_params: dict):
        """Register an MCP tool server."""
        self.tools[name] = {
            "description": description,
            "server_params": server_params,
            "available": True,
        }
        self.logger.info("MCP tool registered", tool=name)

    async def connect_tool(self, name: str) -> Optional[ClientSession]:
        """Establish connection to an MCP tool server."""
        if name not in self.tools:
            self.logger.error("Unknown MCP tool", tool=name)
            return None

        tool_config = self.tools[name]
        try:
            params = StdioServerParameters(**tool_config["server_params"])
            read, write = await stdio_client(params).__aenter__()
            session = ClientSession(read, write)
            await session.__aenter__()
            await session.initialize()

            self.sessions[name] = session
            self.logger.info("MCP tool connected", tool=name)
            return session
        except Exception as e:
            self.logger.error("MCP connection failed", tool=name, error=str(e))
            tool_config["available"] = False
            return None

    async def call_tool(self, tool_name: str, method: str, arguments: dict = None) -> Dict[str, Any]:
        """Call a method on an MCP tool server."""
        session = self.sessions.get(tool_name)
        if not session:
            session = await self.connect_tool(tool_name)
            if not session:
                return {"error": f"Tool {tool_name} unavailable"}

        try:
            result = await session.call_tool(method, arguments=arguments or {})
            self.logger.info("MCP tool call succeeded", tool=tool_name, method=method)
            return {"result": result.content if hasattr(result, "content") else str(result)}
        except Exception as e:
            self.logger.error("MCP tool call failed", tool=tool_name, method=method, error=str(e))
            return {"error": str(e)}

    async def list_tool_capabilities(self, tool_name: str) -> List[Dict[str, str]]:
        """List available methods/capabilities from an MCP tool server."""
        session = self.sessions.get(tool_name)
        if not session:
            session = await self.connect_tool(tool_name)
            if not session:
                return []

        try:
            tools_list = await session.list_tools()
            return [
                {"name": t.name, "description": t.description or ""}
                for t in tools_list.tools
            ]
        except Exception as e:
            self.logger.error("Failed to list capabilities", tool=tool_name, error=str(e))
            return []

    def get_tools_for_agent(self, agent_name: str) -> List[Dict[str, Any]]:
        """
        Get OpenAI-compatible tool definitions for an agent to use.
        These can be passed to the LLM as available functions.
        """
        tool_definitions = []
        for name, config in self.tools.items():
            if config["available"]:
                tool_definitions.append({
                    "type": "function",
                    "function": {
                        "name": f"mcp_{name}",
                        "description": config["description"],
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "method": {"type": "string", "description": "The method to call"},
                                "arguments": {"type": "object", "description": "Arguments for the method"},
                            },
                            "required": ["method"],
                        },
                    },
                })
        return tool_definitions

    async def disconnect_all(self):
        """Disconnect from all MCP tool servers."""
        for name, session in self.sessions.items():
            try:
                await session.__aexit__(None, None, None)
                self.logger.info("MCP tool disconnected", tool=name)
            except Exception as e:
                self.logger.error("Disconnect failed", tool=name, error=str(e))
        self.sessions.clear()


def setup_default_tools(registry: MCPToolRegistry):
    """Register the default set of MCP tools for CRACLE agents."""

    # Web search tool for research-based learning content
    registry.register_tool(
        name="web_search",
        description="Search the web for current information, research papers, and learning resources",
        server_params={
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-brave-search"],
            "env": {"BRAVE_API_KEY": ""},
        },
    )

    # File system tool for document access
    registry.register_tool(
        name="filesystem",
        description="Read and manage learning resource files and documents",
        server_params={
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data/resources"],
        },
    )

    # Database tool for data-driven exercises
    registry.register_tool(
        name="database",
        description="Execute SQL queries for data analysis exercises and simulations",
        server_params={
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-postgres"],
            "env": {"POSTGRES_URL": ""},
        },
    )


# Singleton
mcp_registry = MCPToolRegistry()
