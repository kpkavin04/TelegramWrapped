from telethon.tl.functions.messages import GetHistoryRequest
from telethon.tl.types import Channel, Chat, User

async def get_top_chats(client, limit=50):
    dialogs = await client.get_dialogs()

    top_chats = []
    for d in dialogs:
        if not d.archived:
            top_chats.append({
                "chat_id": d.id,
                "name": d.name,
                "last_message_date": d.message.date if d.message else None,
                "unread_count": d.unread_count
            })

    # Sort by last message date descending (most recently active chats first)
    top_chats.sort(key=lambda x: x["last_message_date"] or 0, reverse=True)

    return top_chats[:limit]