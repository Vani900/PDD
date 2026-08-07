"""CharityAI – WebSocket Router (Real-time)"""
from __future__ import annotations
import asyncio
import json
from datetime import UTC, datetime
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from app.core.security import decode_token
from app.core.exceptions import InvalidTokenException

router = APIRouter(tags=["WebSockets"])


class ConnectionManager:
    """Manages WebSocket connections by user ID and room."""

    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.rooms: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict) -> None:
        if user_id in self.active_connections:
            disconnected = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    disconnected.append(ws)
            for ws in disconnected:
                self.active_connections[user_id].remove(ws)

    async def broadcast(self, message: dict) -> None:
        disconnected_users = []
        for user_id, connections in self.active_connections.items():
            for ws in connections:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    pass

    async def join_room(self, room: str, websocket: WebSocket) -> None:
        if room not in self.rooms:
            self.rooms[room] = []
        self.rooms[room].append(websocket)

    async def broadcast_to_room(self, room: str, message: dict) -> None:
        if room in self.rooms:
            for ws in self.rooms[room]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    pass


manager = ConnectionManager()


@router.websocket("/")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = None) -> None:
    """
    Main WebSocket endpoint.
    Authenticates via JWT token in query param: ws://host/ws?token=<jwt>
    Real-time events: donation_update, notification, live_feed, ai_alert
    """
    user_id = "anonymous"

    if token:
        try:
            payload = decode_token(token, expected_type="access")
            user_id = payload.get("sub", "anonymous")
        except (InvalidTokenException, Exception):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await manager.connect(websocket, user_id)

    # Send welcome event
    await websocket.send_text(json.dumps({
        "type": "connected",
        "user_id": user_id,
        "timestamp": datetime.now(UTC).isoformat(),
        "message": "Connected to CharityAI real-time stream",
    }))

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                event_type = message.get("type", "ping")

                if event_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "timestamp": datetime.now(UTC).isoformat()}))

                elif event_type == "join_room":
                    room = message.get("room", "")
                    await manager.join_room(room, websocket)
                    await websocket.send_text(json.dumps({"type": "room_joined", "room": room}))

                elif event_type == "subscribe_donation":
                    donation_id = message.get("donation_id", "")
                    await manager.join_room(f"donation_{donation_id}", websocket)
                    await websocket.send_text(json.dumps({"type": "subscribed", "donation_id": donation_id}))

                elif event_type == "subscribe_live_feed":
                    await manager.join_room("live_feed", websocket)
                    await websocket.send_text(json.dumps({"type": "live_feed_subscribed"}))

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "message": "Invalid JSON"}))

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception:
        manager.disconnect(websocket, user_id)


@router.websocket("/admin")
async def admin_websocket(websocket: WebSocket, token: Optional[str] = None) -> None:
    """Admin-only WebSocket for real-time dashboard updates."""
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = decode_token(token, expected_type="access")
        if payload.get("role") not in ("super_admin", "admin"):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = payload.get("sub", "admin")
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, f"admin_{user_id}")
    await websocket.send_text(json.dumps({"type": "admin_connected", "message": "Admin real-time channel active"}))

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"admin_{user_id}")
