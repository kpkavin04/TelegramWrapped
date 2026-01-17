from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uuid
from datetime import datetime, timedelta, timezone
from telethon.tl.types import MessageService

from telegram.client import get_client
from telegram.auth import send_otp, verify_otp
from telegram.chats import get_top_chats
from telegram.session_store import load_sessions, save_sessions

app = FastAPI()

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
    chat_ids: list[int]  # List of chat IDs selected by user

# -------------------------------
# Endpoints
# -------------------------------

@app.post("/auth/send-otp")
async def send_otp_endpoint(request: OTPRequest):
    phone = request.phone
    session_id = str(uuid.uuid4())

    # Load existing sessions
    sessions = load_sessions()

    # Create Telegram client
    client = get_client(session_id)

    # Send OTP — this returns phone_code_hash
    phone_code_hash = await send_otp(client, phone)

    # Store session info: phone + phone_code_hash
    sessions[session_id] = {
        "phone": phone,
        "phone_code_hash": phone_code_hash
    }
    save_sessions(sessions)

    return {"status": "otp_sent", "session_id": session_id}


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

    client = get_client(session_id)
    
    # Ensure client is connected before verifying
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
    finally:
        # It's usually better to keep the client connected for the next 
        # immediate request, but if your architecture disconnects, do it here.
        await client.disconnect()


@app.get("/chats/top")
async def top_chats_endpoint(request:TopChatsRequest):
    session_id = request.session_id
    # Load session
    sessions = load_sessions()
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(400, "Invalid session")

    client = get_client(session_id)
    await client.connect()

    try:
        chats = await get_top_chats(client)
    finally:
        await client.disconnect()

    return {"top_chats": chats}


@app.post("/chats/messages")
async def fetch_messages_endpoint(request: FetchMessagesRequest):
    session_id = request.session_id
    chat_ids = request.chat_ids
    
    sessions = load_sessions()
    if session_id not in sessions:
        raise HTTPException(400, "Invalid session")

    client = get_client(session_id)
    await client.connect()

    # Define the cutoff (1 year ago from now)
    one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
    
    all_chat_data = {}

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
    finally:
        await client.disconnect()

    return {
        "status": "success",
        "chat_counts": {cid: len(msgs) for cid, msgs in all_chat_data.items()},
        "data": all_chat_data
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
