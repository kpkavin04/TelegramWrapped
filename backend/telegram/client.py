from telethon import TelegramClient
from dotenv import load_dotenv
import os
import asyncio

load_dotenv()

api_id = int(os.getenv("API_ID"))
api_hash = os.getenv("API_HASH")

# Cache connected clients to avoid SQLite locking
_clients: dict[str, TelegramClient] = {}
_locks: dict[str, asyncio.Lock] = {}

def get_client(session_id: str) -> TelegramClient:
    """Get or create a TelegramClient for the given session_id."""
    os.makedirs("sessions", exist_ok=True)

    if session_id not in _clients:
        _clients[session_id] = TelegramClient(
            f"sessions/{session_id}",
            api_id,
            api_hash
        )

    return _clients[session_id]

def get_lock(session_id: str) -> asyncio.Lock:
    """Get a lock for the given session to prevent concurrent access."""
    if session_id not in _locks:
        _locks[session_id] = asyncio.Lock()
    return _locks[session_id]
