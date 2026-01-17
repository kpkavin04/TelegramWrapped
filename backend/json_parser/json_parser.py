import json
from datetime import datetime
from typing import Dict, List, Any, Optional, Union


class TelegramExportParser:
    """Parse Telegram JSON export: {data: {chat_id: [{text, date, sender_id}]}}"""

    def __init__(self, json_input: Union[str, Dict]):
        if isinstance(json_input, dict):
            self.data = json_input
            self.json_path = None
        else:
            self.json_path = json_input
            self.data = None
        self.messages: List[Dict] = []
        self.chat_ids: List[str] = []

    def load_export(self) -> Dict:
        if self.data is None:
            with open(self.json_path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        return self.data

    def filter_text_messages(self) -> List[Dict]:
        """Parse {data: {chat_id: [msgs]}} format"""
        if not self.data or 'data' not in self.data:
            return []

        self.chat_ids = list(self.data['data'].keys())
        filtered = []

        for chat_id in self.chat_ids:
            for msg in self.data['data'][chat_id]:
                text = msg.get('text', '')
                if not text or not text.strip():
                    continue

                filtered.append({
                    'id': len(filtered),
                    'date': msg.get('date', ''),
                    'from_id': str(msg.get('sender_id', '')),
                    'text': text.strip(),
                    'chat_id': chat_id
                })

        self.messages = filtered
        return filtered

    def add_month_field(self):
        """Add YYYY-MM month field for grouping"""
        for msg in self.messages:
            try:
                dt = datetime.fromisoformat(msg['date'].replace('Z', '+00:00'))
                msg['month'] = dt.strftime('%Y-%m')
            except:
                msg['month'] = 'unknown'

    def get_date_range(self) -> Dict[str, str]:
        if not self.messages:
            return {'start': '', 'end': ''}
        dates = [msg['date'] for msg in self.messages if msg.get('date')]
        if not dates:
            return {'start': '', 'end': ''}
        return {
            'start': min(dates).split('T')[0],
            'end': max(dates).split('T')[0]
        }

    def get_user_messages(self, user_id) -> List[Dict]:
        uid = str(user_id)
        return [msg for msg in self.messages if msg.get('from_id') == uid]

    def get_all_user_ids(self) -> List[str]:
        return list(set(msg.get('from_id') for msg in self.messages if msg.get('from_id')))

    def get_user_stats(self) -> Dict[str, Dict[str, Any]]:
        stats = {}
        for msg in self.messages:
            uid = msg.get('from_id')
            if uid not in stats:
                stats[uid] = {'user_id': uid, 'message_count': 0}
            stats[uid]['message_count'] += 1
        return dict(sorted(stats.items(), key=lambda x: x[1]['message_count'], reverse=True))

    def get_structured_data(self, user_id: Optional[str] = None) -> Dict:
        messages = self.get_user_messages(user_id) if user_id else self.messages
        return {
            'chat_ids': self.chat_ids,
            'date_range': self.get_date_range(),
            'total_messages': len(messages),
            'user_filter': user_id,
            'messages': messages
        }

    def get_flat_text(self, user_id: Optional[str] = None) -> str:
        messages = self.get_user_messages(user_id) if user_id else self.messages
        return '\n'.join(msg.get('text', '') for msg in messages)

    def parse(self) -> Dict:
        self.load_export()
        self.filter_text_messages()
        self.add_month_field()
        return self.get_structured_data()
