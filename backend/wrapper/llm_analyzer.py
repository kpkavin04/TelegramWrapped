import json
from typing import Dict, List, Any
from openai import OpenAI
from collections import defaultdict
from dotenv import load_dotenv
import os


MODEL_NAME = 'gpt-4o-mini'

GEN_Z_EMOTIONS = [
    'chaotic energy', 'unhinged', 'main character vibes', 'villain arc',
    'cozy', 'wholesome', 'salty', 'dramatic', 'hype', 'nostalgic',
    'simp mode', 'down bad', 'existential crisis', 'flirty', 'petty'
]

PERSONAS = {
    'rick': {
        'name': 'Rick Sanchez',
        'show': 'Rick and Morty',
        'traits': 'chaotic genius, nihilistic, unhinged, sarcastic, secretly caring'
    },
    'morty': {
        'name': 'Morty Smith',
        'show': 'Rick and Morty',
        'traits': 'anxious, wholesome, simp tendencies, easily stressed, loyal'
    },
    'patrick': {
        'name': 'Patrick Star',
        'show': 'SpongeBob',
        'traits': 'chaotic energy, clueless, wholesome, unintentionally funny'
    },
    'squidward': {
        'name': 'Squidward Tentacles',
        'show': 'SpongeBob',
        'traits': 'salty, dramatic, existential crisis, pretentious, tired'
    },
    'jake': {
        'name': 'Jake the Dog',
        'show': 'Adventure Time',
        'traits': 'cozy, chill vibes, wise but lazy, supportive bestie'
    },
    'finn': {
        'name': 'Finn the Human',
        'show': 'Adventure Time',
        'traits': 'main character energy, hype, romantic, heroic, emotional'
    },
    'bmo': {
        'name': 'BMO',
        'show': 'Adventure Time',
        'traits': 'wholesome, chaotic innocent, playful, secretly deep'
    },
    'bojack': {
        'name': 'BoJack Horseman',
        'show': 'BoJack Horseman',
        'traits': 'existential crisis, dramatic, self-destructive, nostalgic, deep'
    },
    'princess_carolyn': {
        'name': 'Princess Carolyn',
        'show': 'BoJack Horseman',
        'traits': 'main character vibes, hustler, dramatic, resilient, workaholic'
    },
    'tina': {
        'name': 'Tina Belcher',
        'show': "Bob's Burgers",
        'traits': 'down bad, simp mode, awkward, confident, romantic fantasies'
    },
    'louise': {
        'name': 'Louise Belcher',
        'show': "Bob's Burgers",
        'traits': 'villain arc, chaotic, petty, scheming, secretly wholesome'
    },
    'aang': {
        'name': 'Aang',
        'show': 'Avatar: The Last Airbender',
        'traits': 'wholesome, hype, playful, avoids conflict, main character'
    },
    'zuko': {
        'name': 'Zuko',
        'show': 'Avatar: The Last Airbender',
        'traits': 'dramatic, redemption arc, angsty, honor-obsessed, growth'
    },
    'shrek': {
        'name': 'Shrek',
        'show': 'Shrek',
        'traits': 'salty, protective of peace, secretly wholesome, grumpy exterior'
    },
    'gumball': {
        'name': 'Gumball Watterson',
        'show': 'Amazing World of Gumball',
        'traits': 'chaotic energy, unhinged, dramatic, main character delusion'
    }
}


class LLMAnalyzer:
    """Analyze chat messages using OpenAI API"""

    def __init__(self):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model_name = MODEL_NAME

    def _chat(self, prompt: str, temperature: float = 0.7, max_tokens: int = 512) -> str:
        """Make a chat completion request"""
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content

    def analyze_sentiment_by_month(self, messages: List[Dict]) -> Dict[str, Dict]:
        """Analyze vibe per month with Gen-Z emotions"""
        by_month = defaultdict(list)
        for msg in messages:
            month = msg.get('month', 'unknown')
            by_month[month].append(msg.get('text', ''))

        emotions_str = ', '.join(GEN_Z_EMOTIONS)
        results = {}

        for month, texts in sorted(by_month.items()):
            combined = '\n'.join(texts[:500])

            prompt = f"""Analyze the overall vibe of these chat messages from {month}.

Pick a PRIMARY emotion and SECONDARY emotion from this list:
{emotions_str}

Also give a confidence score 0.0-1.0 and a short 1-sentence vibe summary.

Output ONLY in this format:
primary: [emotion]
secondary: [emotion]
confidence: [0.0-1.0]
vibe_summary: [short summary]

Messages:
{combined}"""

            try:
                response_text = self._chat(prompt, temperature=0.7, max_tokens=512)

                sentiment_data = {
                    'primary': 'wholesome',
                    'secondary': 'cozy',
                    'confidence': 0.0,
                    'vibe_summary': ''
                }
                for line in response_text.strip().split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip().lower()
                        value = value.strip()

                        if key == 'primary':
                            sentiment_data['primary'] = value
                        elif key == 'secondary':
                            sentiment_data['secondary'] = value
                        elif key == 'confidence':
                            try:
                                sentiment_data['confidence'] = float(value)
                            except ValueError:
                                pass
                        elif key == 'vibe_summary':
                            sentiment_data['vibe_summary'] = value

                results[month] = sentiment_data

            except Exception as e:
                print(f"Sentiment error for {month}: {e}")
                results[month] = {
                    'primary': 'error',
                    'secondary': 'error',
                    'confidence': 0.0,
                    'vibe_summary': str(e)
                }

        return results

    def match_persona(self, sentiment_by_month: Dict[str, Dict]) -> Dict[str, Any]:
        """Match user to a cartoon persona based on aggregated emotions"""
        all_primary = [v.get('primary', '') for v in sentiment_by_month.values() if v.get('primary') != 'error']
        all_secondary = [v.get('secondary', '') for v in sentiment_by_month.values() if v.get('secondary') != 'error']
        all_vibes = [v.get('vibe_summary', '') for v in sentiment_by_month.values() if v.get('vibe_summary')]

        emotion_summary = f"""
Primary emotions over time: {', '.join(all_primary)}
Secondary emotions over time: {', '.join(all_secondary)}
Vibe summaries: {'; '.join(all_vibes)}
"""

        persona_options = '\n'.join([
            f"- {pid}: {p['name']} ({p['show']}) - {p['traits']}"
            for pid, p in PERSONAS.items()
        ])

        prompt = f"""Based on this person's chat vibe analysis, match them to ONE cartoon character.

{emotion_summary}

PERSONAS (pick ONE by ID):
{persona_options}

Output ONLY in this format:
persona_id: [id from list above]
match_reason: [1-2 sentence explanation of why this persona fits]
confidence: [0.0-1.0]
"""

        try:
            response_text = self._chat(prompt, temperature=0.7, max_tokens=256)

            result = {
                'persona_id': 'jake',
                'match_reason': '',
                'confidence': 0.0
            }

            for line in response_text.strip().split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().lower()
                    value = value.strip()

                    if key == 'persona_id':
                        pid = value.lower().replace(' ', '_')
                        if pid in PERSONAS:
                            result['persona_id'] = pid
                    elif key == 'match_reason':
                        result['match_reason'] = value
                    elif key == 'confidence':
                        try:
                            result['confidence'] = float(value)
                        except ValueError:
                            pass

            persona = PERSONAS.get(result['persona_id'], PERSONAS['jake'])
            result['persona_name'] = persona['name']
            result['show'] = persona['show']
            result['traits'] = persona['traits']

            return result

        except Exception as e:
            print(f"Persona matching error: {e}")
            return {
                'persona_id': 'error',
                'persona_name': 'Unknown',
                'show': 'Unknown',
                'traits': '',
                'match_reason': str(e),
                'confidence': 0.0
            }


# Alias for backward compatibility
GeminiAnalyzer = LLMAnalyzer
