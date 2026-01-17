"""
Telegram Wrapped Orchestrator
Main interface for analyzing chat exports
"""

from typing import Dict, List, Any, Optional
from collections import Counter

from json_parser.json_parser import TelegramExportParser
from wrapper.frequency_couner import FrequencyCounter
from wrapper.llm_analyzer import LLMAnalyzer


class TelegramWrappedOrchestrator:
    """Orchestrate full chat analysis pipeline"""

    def __init__(self):
        self.llm = LLMAnalyzer()

    def get_chat_users(self, json_data: Dict) -> Dict[str, Dict]:
        """Get users in chat before analysis

        Args:
            json_data: Raw Telegram export JSON

        Returns:
            {user_id: {username, message_count}}
        """
        parser = TelegramExportParser(json_data)
        parser.load_export()
        parser.filter_text_messages()
        return parser.get_user_stats()

    def analyze_chat(self, json_data: Dict, user_id: str) -> Dict[str, Any]:
        """Analyze single chat for a specific user

        Args:
            json_data: Raw Telegram export JSON
            user_id: Target user ID to analyze

        Returns:
            Full analysis results dict
        """
        # 1. Parse JSON
        parser = TelegramExportParser(json_data)
        parser.load_export()
        parser.filter_text_messages()
        parser.add_month_field()

        # Get all messages (for sentiment context)
        all_data = parser.get_structured_data()

        # Get user-specific messages
        user_messages = parser.get_user_messages(user_id)
        user_text = '\n'.join(msg.get('text', '') for msg in user_messages)

        # 2. Frequency analysis (local, no API)
        freq_counter = FrequencyCounter(user_text)
        word_freq = freq_counter.count_words(top_n=50)
        emoji_freq = freq_counter.count_emojis()
        wordcloud_b64 = freq_counter.generate_wordcloud()

        # 3. Sentiment analysis (all messages for context)
        sentiment = self.llm.analyze_sentiment_by_month(all_data['messages'])

        # 4. Persona matching based on sentiment
        persona = self.llm.match_persona(sentiment)

        # 5. Build result
        total_in_chat = len(parser.messages)
        user_count = len(user_messages)

        return {
            'user_id': user_id,
            'chat_ids': all_data.get('chat_ids', []),
            'date_range': parser.get_date_range(),
            'message_stats': {
                'total_in_chat': total_in_chat,
                'user_count': user_count,
                'user_percentage': round(user_count / total_in_chat * 100, 1) if total_in_chat else 0
            },
            'word_frequency': word_freq,
            'emoji_frequency': emoji_freq,
            'wordcloud_image': wordcloud_b64,
            'sentiment_by_month': sentiment,
            'persona': persona,
            'top_words': list(word_freq.keys())[:10],
            'top_emojis': list(emoji_freq.keys())[:5]
        }

    def analyze_multi_chat(self, chats: List[Dict], user_id: str) -> Dict[str, Any]:
        """Aggregate stats across multiple chats

        Args:
            chats: List of raw Telegram export JSONs
            user_id: Target user ID to analyze

        Returns:
            {per_chat: [...], aggregate: {...}}
        """
        per_chat_results = []
        all_word_freq = Counter()
        all_emoji_freq = Counter()
        all_sentiment = {}
        all_user_text = []

        for chat_data in chats:
            # Analyze each chat
            result = self.analyze_chat(chat_data, user_id)
            per_chat_results.append(result)

            # Aggregate word frequencies
            all_word_freq.update(result['word_frequency'])

            # Aggregate emoji frequencies
            all_emoji_freq.update(result['emoji_frequency'])

            # Merge sentiment timelines
            for month, data in result['sentiment_by_month'].items():
                if month not in all_sentiment:
                    all_sentiment[month] = data

            # Collect text for aggregate wordcloud
            parser = TelegramExportParser(chat_data)
            parser.load_export()
            parser.filter_text_messages()
            user_msgs = parser.get_user_messages(user_id)
            all_user_text.extend(msg.get('text', '') for msg in user_msgs)

        # Generate aggregate wordcloud
        combined_text = '\n'.join(all_user_text)
        freq_counter = FrequencyCounter(combined_text)
        aggregate_wordcloud = freq_counter.generate_wordcloud()

        # Persona matching on aggregate sentiment
        aggregate_persona = self.llm.match_persona(all_sentiment)

        # Total stats
        total_messages = sum(r['message_stats']['user_count'] for r in per_chat_results)

        return {
            'per_chat': per_chat_results,
            'aggregate': {
                'user_id': user_id,
                'total_chats': len(chats),
                'total_messages': total_messages,
                'word_frequency': dict(all_word_freq.most_common(50)),
                'emoji_frequency': dict(all_emoji_freq.most_common(20)),
                'wordcloud_image': aggregate_wordcloud,
                'sentiment_by_month': all_sentiment,
                'persona': aggregate_persona,
                'top_words': [w for w, _ in all_word_freq.most_common(10)],
                'top_emojis': [e for e, _ in all_emoji_freq.most_common(5)]
            }
        }
