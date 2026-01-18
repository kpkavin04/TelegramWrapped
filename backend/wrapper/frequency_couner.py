"""
Frequency Counter for User Messages
Local word/emoji counting without API calls
"""

import re
from collections import Counter
from typing import Dict, List, Optional

try:
    from backend.utils.wordcloud_generator import WordCloudGenerator
except ImportError:
    WordCloudGenerator = None

# Common English stopwords + telegram-specific
STOPWORDS = {
    # English common
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'it', 'this', 'that', 'was', 'are',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'just', 'not', 'no', 'yes', 'so', 'if',
    'then', 'than', 'when', 'what', 'where', 'who', 'which', 'how', 'why',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'only', 'own', 'same', 'too', 'very', 'also', 'any', 'as', 'about',
    'up', 'out', 'into', 'over', 'after', 'before', 'between', 'under', 'again',
    'there', 'here', 'they', 'them', 'their', 'he', 'him', 'his', 'she', 'her',
    'we', 'us', 'our', 'you', 'your', 'my', 'me', 'i', 'am', 'been', 'being',
    'get', 'got', 'getting', 'go', 'going', 'went', 'come', 'coming', 'came',
    'like', 'know', 'think', 'want', 'see', 'look', 'make', 'take', 'say', 'said',
    'well', 'back', 'now', 'way', 'even', 'new', 'because', 'still', 'oh', 'ok',
    'okay', 'yeah', 'ya', 'yea', 'really', 'actually', 'dont', "don't", 'im', "i'm",
    'its', "it's", 'thats', "that's", 'youre', "you're", 'were', "we're",
    # Telegram specific
    'sticker', 'forwarded', 'message', 'replied', 'reply', 'photo', 'video',
    'voice', 'file', 'gif', 'http', 'https', 'www', 'com', 'ah','eh','mm','hmm','bro',
    'sis','dude','lol','omg','btw','idk','smh','fyi','ty','thx','np','yw','yall','la','eh',
    'yeah','uh','uhh','hahaha','hehe','haha','hehehe','yea','ye',
}

# Emoji regex pattern (covers most Unicode emoji)
EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map
    "\U0001F1E0-\U0001F1FF"  # flags
    "\U00002702-\U000027B0"  # dingbats
    "\U000024C2-\U0001F251"  # enclosed chars
    "\U0001F900-\U0001F9FF"  # supplemental symbols
    "\U0001FA00-\U0001FA6F"  # chess symbols
    "\U0001FA70-\U0001FAFF"  # symbols extended
    "\U00002600-\U000026FF"  # misc symbols
    "]+",
    flags=re.UNICODE
)


class FrequencyCounter:
    """Count word and emoji frequencies from text"""

    def __init__(self, text: str):
        """
        Args:
            text: Full text string from user messages
        """
        self.text = text
        self._word_freq: Optional[Dict[str, int]] = None
        self._emoji_freq: Optional[Dict[str, int]] = None

    def count_words(self, top_n: int = 50) -> Dict[str, int]:
        """Count word frequencies, filter stopwords

        Args:
            top_n: Return top N words

        Returns:
            {word: count} sorted by count desc
        """
        if self._word_freq is not None:
            # Return cached, sliced to top_n
            return dict(list(self._word_freq.items())[:top_n])

        # Extract words (alphanumeric only)
        words = re.findall(r'\b[a-zA-Z]{2,}\b', self.text.lower())

        # Filter stopwords
        filtered = [w for w in words if w not in STOPWORDS]

        # Count
        counter = Counter(filtered)

        # Cache full results
        self._word_freq = dict(counter.most_common())

        return dict(counter.most_common(top_n))

    def count_emojis(self) -> Dict[str, int]:
        """Count emoji frequencies

        Returns:
            {emoji: count} sorted by count desc
        """
        if self._emoji_freq is not None:
            return self._emoji_freq

        # Find all emoji
        emojis = EMOJI_PATTERN.findall(self.text)

        # Split compound emoji (e.g. flag sequences)
        all_emojis = []
        for e in emojis:
            all_emojis.extend(list(e))

        counter = Counter(all_emojis)
        self._emoji_freq = dict(counter.most_common())

        return self._emoji_freq

    def generate_wordcloud(self, theme: str = 'default') -> str:
        """Generate word cloud from word frequencies

        Args:
            theme: Color theme (default, dark, ocean, sunset, forest, purple)

        Returns:
            Base64 encoded PNG image string, or empty string if wordcloud unavailable
        """
        if WordCloudGenerator is None:
            return ''

        # Get word frequencies first
        word_freq = self.count_words(top_n=100)

        if not word_freq:
            generator = WordCloudGenerator()
            return generator._generate_empty_wordcloud()

        generator = WordCloudGenerator()
        return generator.generate_from_frequencies(word_freq)

    def get_stats(self) -> Dict:
        """Get all stats in one call

        Returns:
            {word_frequency, emoji_frequency, top_words, top_emojis}
        """
        word_freq = self.count_words(top_n=50)
        emoji_freq = self.count_emojis()

        return {
            'word_frequency': word_freq,
            'emoji_frequency': emoji_freq,
            'top_words': list(word_freq.keys())[:10],
            'top_emojis': list(emoji_freq.keys())[:5]
        }
