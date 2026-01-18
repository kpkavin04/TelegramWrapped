from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from datetime import datetime, timedelta, timezone
from telethon.tl.types import MessageService
import json

from telegram.client import get_client, get_lock
from telegram.auth import send_otp, verify_otp
from telegram.chats import get_top_chats
from telegram.session_store import load_sessions, save_sessions
from orchestrator import TelegramWrappedOrchestrator

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Pydantic models for requests
# -------------------------------
class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    session_id: str
    code: str
    password: str = None  # Optional, for 2FA

class TopChatsRequest(BaseModel):
    session_id: str

class FetchMessagesRequest(BaseModel):
    session_id: str
    chat_ids: list[int]
    phone: str
    code: str
    password: str = None  # Optional, for 2FA

# -------------------------------
# Endpoints
# -------------------------------

@app.post("/auth/send-otp")
async def send_otp_endpoint(request: OTPRequest):
    phone = request.phone
    session_id = str(uuid.uuid4())

    # Load existing sessions
    sessions = load_sessions()

    async with get_lock(session_id):
        client = get_client(session_id)
        # Send OTP — this returns phone_code_hash
        phone_code_hash = await send_otp(client, phone)

    # Store session info: phone + phone_code_hash
    sessions[session_id] = {
        "phone": phone,
        "phone_code_hash": phone_code_hash
    }
    save_sessions(sessions)

    return {"session_id": session_id}


@app.post("/auth/verify-otp")
async def verify_otp_endpoint(request: OTPVerify):
    session_id = request.session_id
    code = request.code
    password = request.password

    sessions = load_sessions()
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(400, "Invalid session")

    phone = session["phone"]
    phone_code_hash = session["phone_code_hash"]

    async with get_lock(session_id):
        client = get_client(session_id)
        if not client.is_connected():
            await client.connect()

        try:
            # 1. Verify the OTP
            await verify_otp(client, phone, code, phone_code_hash, password)

            # 2. Get the User ID now that we are authorized
            me = await client.get_me()
            user_id = me.id

            # 3. Update the session store with the new user_id
            sessions[session_id]["user_id"] = user_id
            save_sessions(sessions)

            return {
                "status": "authenticated",
                "user_id": user_id,
                "first_name": me.first_name
            }

        except Exception as e:
            raise HTTPException(400, str(e))


@app.get("/chats/top")
async def top_chats_endpoint(session_id: str):
    # Load session
    sessions = load_sessions()
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(400, "Invalid session")

    async with get_lock(session_id):
        client = get_client(session_id)
        if not client.is_connected():
            await client.connect()
        chats = await get_top_chats(client)

    return {"top_chats": chats}


@app.post("/chats/messages")
async def fetch_messages_endpoint(request: FetchMessagesRequest):
    session_id = request.session_id
    chat_ids = request.chat_ids

    sessions = load_sessions()

    if session_id not in sessions:
        raise HTTPException(400, "Invalid session")

    user_id = sessions[session_id]["user_id"]

    # Define the cutoff (1 year ago from now)
    one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)

    all_chat_data = {}

    async with get_lock(session_id):
        client = get_client(session_id)
        if not client.is_connected():
            await client.connect()

        try:
            for chat_id in chat_ids:
                messages = []
                # iter_messages pulls from newest to oldest
                async for msg in client.iter_messages(chat_id):
                    # Stop if message is older than 1 year
                    if msg.date < one_year_ago:
                        break

                    # Only keep text messages, ignore service messages (joins/leaves)
                    if msg.text and not isinstance(msg, MessageService):
                        messages.append({
                            "text": msg.text,
                            "date": msg.date.isoformat(),
                            "sender_id": msg.sender_id
                        })

                all_chat_data[chat_id] = messages

        except Exception as e:
            raise HTTPException(500, f"Error fetching messages: {str(e)}")

    # Convert to list of chat data dicts for analyze_multi_chat
    # Each chat needs format: {data: {chat_id: [msgs]}}
    chats_list = [
        {"data": {str(chat_id): msgs}}
        for chat_id, msgs in all_chat_data.items()
    ]

    orchestrator = TelegramWrappedOrchestrator()

    return await orchestrator.analyze_multi_chat(chats_list, str(user_id))


@app.get("/health")
def health_check():
    return {"status": "ok"}
