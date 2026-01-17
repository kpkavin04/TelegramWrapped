# Telegram Export Parser

Parses Telegram JSON exports, extracts text messages, filters media/service messages.

## Class: TelegramExportParser

### Constructor
```python
TelegramExportParser(json_input: Union[str, Dict])
```
- **json_input**: File path (str) or JSON dict
- Auto-detects type, stores data or path
- Initializes empty messages list

### Core Methods

#### `load_export() -> Dict`
- Loads JSON from file if path provided
- If dict passed to constructor, returns immediately
- Sets `self.data` with full export
- Returns data dict

#### `extract_text(message: Dict) -> str`
- Gets text from single message
- Priority: `text_entities` (joins all parts) → plain `text` field
- Returns string (empty if no text)

#### `filter_text_messages() -> List[Dict]`
- Main filtering logic
- **Keeps**: messages with text (type="message")
- **Drops**:
  - Service messages (type="service")
  - Media-only (photo, file, sticker, video_file, voice_message, video_message)
  - Empty text
- Returns list: `[{id, date, from, from_id, text}, ...]`
- Stores in `self.messages`

#### `add_month_field()`
- Adds `month: "YYYY-MM"` to each message
- Parses ISO date format
- Fallback: "unknown" if parse fails
- Modifies `self.messages` in place

#### `get_date_range() -> Dict[str, str]`
- Finds min/max dates from messages
- Returns: `{start: "YYYY-MM-DD", end: "YYYY-MM-DD"}`
- Empty strings if no messages

#### `get_user_messages(user_id: str) -> List[Dict]`
- Filter messages from specific user by user ID
- Returns list of messages where `from_id` matches user_id
- Used for per-user analysis

#### `get_all_user_ids() -> List[str]`
- Get all unique user IDs in chat
- Returns list of user ID strings
- Useful for identifying chat participants

#### `get_user_stats() -> Dict[str, Dict[str, Any]]`
- Get message count per user with details
- Returns dict: `{user_id: {'username': str, 'user_id': str, 'message_count': int}}`
- Sorted by message count (descending)
- Example: `{'user123': {'username': 'Alice', 'user_id': 'user123', 'message_count': 150}}`

#### `get_structured_data(user_id: Optional[str] = None) -> Dict`
- Returns dict with metadata + messages
- **user_id**: If provided, only includes messages from that user ID
- Format:
```python
{
  'chat_name': str,
  'chat_type': str,
  'date_range': {start, end},
  'total_messages': int,
  'user_filter': str or None,
  'messages': [{id, date, month, from, from_id, text}, ...]
}
```
- For in-memory use (no file I/O)

#### `get_flat_text(user_id: Optional[str] = None) -> str`
- Returns text formatted for LLM input
- **user_id**: If provided, only includes messages from that user ID
- Format: `[YYYY-MM] User: message text`
- One line per message
- Newline separated

#### `export_structured_json(output_path: str)`
- Writes structured data to JSON file
- Calls `get_structured_data()` internally
- UTF-8, indented, preserves non-ASCII

#### `export_flat_text(output_path: str)`
- Writes flat text to file
- Calls `get_flat_text()` internally
- UTF-8 encoding

#### `parse() -> Dict`
- **No-file workflow**
- Pipeline: load → filter → add months → return structured
- Returns structured data dict
- Nothing saved to disk

#### `parse_and_export(json_output='messages.json', txt_output='for_analysis.txt')`
- **File workflow**
- Pipeline: load → filter → add months → save both formats
- Returns message count

## Usage

### In-Memory (No Files)
```python
parser = TelegramExportParser('export.json')
structured_data = parser.parse()
flat_text = parser.get_flat_text()

# structured_data = dict with messages
# flat_text = string for LLM
```

### With File Export
```python
parser = TelegramExportParser('export.json')
count = parser.parse_and_export('out.json', 'out.txt')
# Saves messages.json + for_analysis.txt
```

### From Dict (No File Load)
```python
import json
data = json.load(open('export.json'))
parser = TelegramExportParser(data)
structured = parser.parse()
```

### User-Specific Analysis (by User ID)
```python
parser = TelegramExportParser('export.json')
parser.parse()

# Get all user IDs
user_ids = parser.get_all_user_ids()  # ['user123', 'user456']

# Get stats with username mapping
stats = parser.get_user_stats()
# {'user456': {'username': 'Bob', 'user_id': 'user456', 'message_count': 150},
#  'user123': {'username': 'Alice', 'user_id': 'user123', 'message_count': 100}}

# Get data for specific user by ID
alice_data = parser.get_structured_data('user123')
alice_text = parser.get_flat_text('user123')

# alice_data contains only Alice's messages
# alice_text contains only Alice's formatted messages
```

## Data Flow

```
Input JSON
    ↓
load_export() - loads file or uses dict
    ↓
filter_text_messages() - removes media/service, extracts text
    ↓
add_month_field() - adds YYYY-MM grouping
    ↓
Branch:
  → get_structured_data() - dict for analysis
  → get_flat_text() - string for LLM
  → export_* - save to files
```

## Telegram Export Format

Expected structure:
```json
{
  "name": "Chat Name",
  "type": "personal_chat",
  "messages": [
    {
      "id": 1,
      "type": "message",
      "date": "2024-01-15T10:30:45",
      "from": "User",
      "from_id": "user123",
      "text": "Hello"
    },
    {
      "id": 2,
      "type": "message",
      "date": "2024-01-15T10:31:00",
      "from": "User",
      "from_id": "user123",
      "text_entities": [
        {"type": "plain", "text": "Hi "},
        {"type": "bold", "text": "there"}
      ]
    }
  ]
}
```

**Key fields:**
- `from`: Display name (can change)
- `from_id`: Unique user ID (permanent)
- Parser uses `from_id` for filtering

## Filtering Rules

**Kept**:
- type="message"
- Has text or text_entities with content
- Text not empty after strip

**Dropped**:
- type="service"
- Has media fields (photo, sticker, etc.)
- Empty/whitespace-only text
- Media captions if text empty

## Output Formats

### Structured JSON (messages.json)
Metadata + array of clean messages. For programmatic access, time analysis, filtering.

### Flat Text (for_analysis.txt)
Simple text format. For LLM word/emoji counting, sentiment analysis. Human readable.

## User Segregation Use Case

**Problem**: Telegram Wrapped report needs:
1. **Overall chat stats** - all messages from all users
2. **Personal stats** - specific user's word/emoji frequency

**Solution**: Pass user_id parameter
```python
# Chat-wide analysis
all_messages_text = parser.get_flat_text()
# → Use for overall sentiment, chat activity

# User-specific analysis (by user ID)
target_user_id = 'user123'  # The person getting the report
user_text = parser.get_flat_text(target_user_id)
# → Use for user's top words, emojis, messaging patterns
```

**Why user_id instead of username?**
- User IDs are unique and permanent
- Usernames can change over time
- More reliable for identification

**Orchestrator Flow**:
1. Parse JSON for each chat
2. Identify target user ID (person getting report)
3. Extract two datasets:
   - `get_flat_text()` - entire chat
   - `get_flat_text(target_user_id)` - user only
4. Analyze both separately
5. Combine in final report
