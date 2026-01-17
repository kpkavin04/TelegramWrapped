from telethon import TelegramClient
from dotenv import load_dotenv
import os

load_dotenv()

api_id = int(os.getenv("API_ID"))
api_hash = os.getenv("API_HASH")

def get_client(session_id: str):
    os.makedirs("sessions", exist_ok=True)

    return TelegramClient(
        f"sessions/{session_id}",
        api_id,
        api_hash
    )