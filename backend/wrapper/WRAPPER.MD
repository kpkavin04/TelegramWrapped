# Gemini Wrapper for Chat Analysis

Analyzes parsed Telegram chat data using Gemini API.

## Class: GeminiAnalyzer

### Constructor
```python
GeminiAnalyzer()
```
- Loads API key from `.env` (GENAI_API_KEY)
- Initializes Gemini client
- Uses model: `gemini-2.0-flash-exp`

### Core Analysis Methods

#### `analyze_word_frequency(text: str, top_n: int = 50) -> Dict[str, int]`
- Analyzes text, returns top N words
- Excludes common stopwords (the, a, is, etc.)
- Returns: `{word: count}`
- Temperature: 0.5 (deterministic counting)

#### `analyze_emoji_frequency(text: str) -> Dict[str, int]`
- Extracts all emoji from text
- Returns: `{emoji: count}`
- Temperature: 0.5 (deterministic counting)

#### `analyze_sentiment_by_month(messages: List[Dict]) -> Dict[str, Dict]`
- Analyzes sentiment per month
- Groups messages by `month` field
- Returns: `{month: {sentiment: str, confidence: float}}`
- Sentiment values: positive, negative, neutral
- Temperature: 1.0 (subjective analysis)

### Main Analysis Method

#### `analyze(all_messages_data: Dict, user_text: str) -> Dict[str, Any]`
Primary method for complete chat analysis with user segregation.

**Parameters:**
- `all_messages_data`: Structured data with ALL messages
  - Used for sentiment analysis (needs full context)
  - Get from: `parser.get_structured_data()`
- `user_text`: Flat text from target user only
  - Used for word/emoji frequency (personal stats)
  - Get from: `parser.get_flat_text(user_id)`

**Returns:**
```python
{
  'word_frequency': {word: count},        # From user_text
  'emoji_frequency': {emoji: count},      # From user_text
  'sentiment_by_month': {                 # From all_messages_data
    'YYYY-MM': {
      'sentiment': 'positive/negative/neutral',
      'confidence': 0.85
    }
  },
  'metadata': {
    'chat_name': str,
    'total_messages': int,
    'date_range': {start, end},
    'user_filter': str or None
  }
}
```

**Why Two Inputs?**
- **Sentiment**: Needs full conversation context (all users) for accuracy
- **Word/Emoji**: Personal stats for report recipient (one user)

## Usage Example

```python
from backend.json_parser.json_parser import TelegramExportParser
from backend.wrapper.gemini_wrapper import GeminiAnalyzer

# Parse chat
parser = TelegramExportParser('chat.json')
parser.parse()

# Get data
target_user_id = 'user123'
all_data = parser.get_structured_data()          # All messages
user_text = parser.get_flat_text(target_user_id) # User only

# Analyze
analyzer = GeminiAnalyzer()
results = analyzer.analyze(all_data, user_text)

print(f"Top words: {list(results['word_frequency'].keys())[:5]}")
print(f"Top emojis: {list(results['emoji_frequency'].keys())[:5]}")
print(f"Months analyzed: {len(results['sentiment_by_month'])}")
```

## Analysis Details

### Word Frequency
- LLM-based counting (approximate)
- Filters common words automatically
- Returns top 50 by default
- **Note**: Consider local Python counter for accuracy

### Emoji Frequency
- LLM extracts emoji patterns
- Counts all occurrences
- Handles compound emojis
- **Note**: Consider regex-based extraction for accuracy

### Sentiment Analysis
- Context-aware per month
- Uses first 500 messages per month (token limit)
- Returns sentiment + confidence score
- Best use case for LLM (requires understanding)

## API Configuration

Model: `gemini-2.0-flash-exp`
- 1M token context window
- Fast inference
- Cost-effective

Temperature settings:
- 0.5 for counting (word/emoji) - more deterministic
- 1.0 for sentiment - creative analysis

## Error Handling

Methods return empty dict or error sentinel on failure:
- Word frequency: `{}` 
- Emoji frequency: `{}`
- Sentiment: `{'sentiment': 'error', 'confidence': 0.0}`

Errors printed to console.
