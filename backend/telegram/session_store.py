import json
import os

SESSION_FILE = "sessions/session_map.json"

def load_sessions():
    if not os.path.exists(SESSION_FILE):
        return {}
    with open(SESSION_FILE, "r") as f:
        return json.load(f)

def save_sessions(sessions):
    os.makedirs("sessions", exist_ok=True)
    with open(SESSION_FILE, "w") as f:
        json.dump(sessions, f)