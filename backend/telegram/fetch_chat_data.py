import asyncio
from datetime import datetime, timedelta, timezone
from telethon import TelegramClient
from telethon.tl.types import MessageService

async def fetch_yearly_histories(client: TelegramClient, chat_ids: list):
    """
    Iterates through a list of chats and fetches text messages from the last 365 days.
    """
    # Define the 'one year ago' cutoff
    one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
    
    # This will hold the final corpus of data
    # Format: { chat_id: [list of message texts] }
    all_data = {}

    for chat_id in chat_ids:
        print(f"Fetching history for chat: {chat_id}...")
        chat_messages = []
        
        try:
            # offset_date fetches messages OLDER than the date. 
            # To get messages NEWER than a year ago, we iterate normally 
            # and stop when we hit a message older than our cutoff.
            async for message in client.iter_messages(chat_id):
                # Stop if we've gone back further than 1 year
                if message.date < one_year_ago:
                    break
                
                # Filter for text only (ignores service messages, polls, etc.)
                if message.text and not isinstance(message, MessageService):
                    chat_messages.append({
                        "text": message.text,
                        "date": message.date.isoformat(),
                        "sender_id": message.sender_id
                    })
            
            all_data[chat_id] = chat_messages
            
            # Essential: Prevent FloodWait by sleeping briefly between chats
            await asyncio.sleep(1) 
            
        except Exception as e:
            print(f"Error fetching chat {chat_id}: {e}")
            all_data[chat_id] = []

    return all_data