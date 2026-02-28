"""
CRACLE - WebSocket endpoint for streaming agent reasoning
"""

from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import structlog
import json
import asyncio

from app.db.database import get_db

logger = structlog.get_logger(__name__)
router = APIRouter()


class ReasoningBroadcaster:
    """Manages WebSocket connections for broadcasting agent reasoning."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        """Add a new WebSocket connection."""
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        self.active_connections[session_id].add(websocket)
        logger.info("WebSocket connected", session_id=session_id)

    def disconnect(self, websocket: WebSocket, session_id: str):
        """Remove a WebSocket connection."""
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        logger.info("WebSocket disconnected", session_id=session_id)

    async def broadcast_reasoning_step(self, session_id: str, step_data: dict):
        """Broadcast a reasoning step to all connected clients."""
        if session_id not in self.active_connections:
            return

        message = json.dumps(step_data)
        disconnected = set()

        for connection in self.active_connections[session_id]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error("Failed to send reasoning step", error=str(e))
                disconnected.add(connection)

        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(connection, session_id)


# Global broadcaster instance
reasoning_broadcaster = ReasoningBroadcaster()


@router.websocket("/ws/reasoning/{session_id}")
async def reasoning_websocket(
    websocket: WebSocket,
    session_id: str,
):
    """
    WebSocket endpoint for streaming agent reasoning steps.
    
    Clients connect with a session_id and receive real-time updates
    about agent activities, thoughts, and decisions.
    """
    await reasoning_broadcaster.connect(websocket, session_id)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "session_id": session_id,
            "message": "Connected to reasoning stream"
        })

        # Keep the connection alive
        while True:
            # Wait for client pings to detect disconnections
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        reasoning_broadcaster.disconnect(websocket, session_id)
    except Exception as e:
        logger.error("WebSocket error", error=str(e), session_id=session_id)
        reasoning_broadcaster.disconnect(websocket, session_id)


async def emit_reasoning_step(
    session_id: str,
    agent_name: str,
    step_type: str,
    content: str,
    metadata: dict = None
):
    """
    Emit a reasoning step to all connected clients.
    
    Args:
        session_id: Unique session identifier
        agent_name: Name of the agent (planner, mentor, etc.)
        step_type: Type of step (thinking, executing, communicating, completed)
        content: Human-readable description of what the agent is doing
        metadata: Additional data (progress, results, etc.)
    """
    step_data = {
        "type": "reasoning_step",
        "agent": agent_name,
        "step_type": step_type,
        "content": content,
        "metadata": metadata or {},
        "timestamp": asyncio.get_event_loop().time()
    }
    
    await reasoning_broadcaster.broadcast_reasoning_step(session_id, step_data)
