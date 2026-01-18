import json
import asyncio
from typing import Dict, List, Any
from openai import AsyncOpenAI
from collections import defaultdict
from dotenv import load_dotenv
import os


MODEL_NAME = 'gpt-4o-mini'
MAX_CONCURRENT_REQUESTS = 4  # Limit parallel LLM calls to avoid rate limits
MAX_RETRIES = 3
RETRY_BASE_DELAY = 1.0  # seconds

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
    """Analyze chat messages using OpenAI API with async support"""

    def __init__(self):
        load_dotenv()
        self.client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model_name = MODEL_NAME
        self._semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

    async def _chat(self, prompt: str, temperature: float = 0.7, max_tokens: int = 512) -> str:
        """Make an async chat completion request with rate limit handling"""
        async with self._semaphore:
            for attempt in range(MAX_RETRIES):
                try:
                    response = await self.client.chat.completions.create(
                        model=self.model_name,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                    return response.choices[0].message.content
                except Exception as e:
                    error_str = str(e)
                    if '429' in error_str or 'rate_limit' in error_str.lower():
                        delay = RETRY_BASE_DELAY * (2 ** attempt)
                        print(f"Rate limit hit, retrying in {delay}s (attempt {attempt + 1}/{MAX_RETRIES})")
                        await asyncio.sleep(delay)
                    else:
                        raise
            raise Exception(f"Max retries ({MAX_RETRIES}) exceeded for LLM call")

    async def _analyze_month_batch(self, months_data: List[tuple], emotions_str: str) -> Dict[str, Dict]:
        """Analyze sentiment for a batch of months in one LLM call"""
        # Build prompt with all months
        months_section = []
        for month, texts in months_data:
            combined = '\n'.join(texts[:150])  # Fewer msgs per month in batch
            months_section.append(f"=== {month} ===\n{combined}")

        all_months = '\n\n'.join(months_section)
        month_names = [m for m, _ in months_data]

        prompt = f"""Analyze the vibe of these chat messages for EACH month listed below.

For EACH month, pick a PRIMARY and SECONDARY emotion from:
{emotions_str}

Output EXACTLY in this format for each month (one block per month):

[MONTH_NAME]
primary: [emotion]
secondary: [emotion]
confidence: [0.0-1.0]
vibe_summary: [short 1-sentence summary]

Analyze these months: {', '.join(month_names)}

Messages by month:
{all_months}"""

        try:
            response_text = await self._chat(prompt, temperature=0.7, max_tokens=256 * len(months_data))
            print(f"[LLM Sentiment Batch {month_names}]\n{response_text}\n")

            results = {}
            current_month = None
            current_data = {}

            for line in response_text.strip().split('\n'):
                line = line.strip()
                if not line:
                    continue

                # Check if line is a month header
                line_clean = line.strip('[]').strip()
                if line_clean in month_names or any(m in line_clean for m in month_names):
                    # Save previous month if exists
                    if current_month and current_data:
                        results[current_month] = current_data
                    # Find matching month
                    for m in month_names:
                        if m in line_clean:
                            current_month = m
                            break
                    current_data = {
                        'primary': 'wholesome',
                        'secondary': 'cozy',
                        'confidence': 0.0,
                        'vibe_summary': ''
                    }
                elif ':' in line and current_month:
                    key, value = line.split(':', 1)
                    key = key.strip().lower()
                    value = value.strip()

                    if key == 'primary':
                        current_data['primary'] = value
                    elif key == 'secondary':
                        current_data['secondary'] = value
                    elif key == 'confidence':
                        try:
                            current_data['confidence'] = float(value)
                        except ValueError:
                            pass
                    elif key == 'vibe_summary':
                        current_data['vibe_summary'] = value

            # Save last month
            if current_month and current_data:
                results[current_month] = current_data

            # Fill in any missing months with defaults
            for month, _ in months_data:
                if month not in results:
                    results[month] = {
                        'primary': 'wholesome',
                        'secondary': 'cozy',
                        'confidence': 0.0,
                        'vibe_summary': ''
                    }

            return results

        except Exception as e:
            print(f"Sentiment batch error: {e}")
            return {
                month: {
                    'primary': 'error',
                    'secondary': 'error',
                    'confidence': 0.0,
                    'vibe_summary': str(e)
                }
                for month, _ in months_data
            }

    async def analyze_sentiment_by_month(self, messages: List[Dict]) -> Dict[str, Dict]:
        """Analyze vibe per month - BATCHED (3-4 months per call)"""
        by_month = defaultdict(list)
        for msg in messages:
            month = msg.get('month', 'unknown')
            by_month[month].append(msg.get('text', ''))

        emotions_str = ', '.join(GEN_Z_EMOTIONS)
        sorted_months = sorted(by_month.items())

        # Batch months: 4 months per LLM call
        BATCH_SIZE = 4
        batches = []
        for i in range(0, len(sorted_months), BATCH_SIZE):
            batches.append(sorted_months[i:i + BATCH_SIZE])

        # Run batches in parallel
        tasks = [self._analyze_month_batch(batch, emotions_str) for batch in batches]
        batch_results = await asyncio.gather(*tasks)

        # Merge all results
        results = {}
        for batch_result in batch_results:
            results.update(batch_result)

        return results

    async def match_persona(self, sentiment_by_month: Dict[str, Dict], top_words: List[str] = None) -> Dict[str, Any]:
        """Match user to a cartoon persona based on aggregated emotions and word usage"""
        all_primary = [v.get('primary', '') for v in sentiment_by_month.values() if v.get('primary') != 'error']
        all_secondary = [v.get('secondary', '') for v in sentiment_by_month.values() if v.get('secondary') != 'error']
        all_vibes = [v.get('vibe_summary', '') for v in sentiment_by_month.values() if v.get('vibe_summary')]

        words_str = ', '.join(top_words[:20]) if top_words else 'N/A'

        emotion_summary = f"""
Primary emotions over time: {', '.join(all_primary)}
Secondary emotions over time: {', '.join(all_secondary)}
Vibe summaries: {'; '.join(all_vibes)}
Top 20 most used words: {words_str}
"""

        persona_options = '\n'.join([
            f"- {pid}: {p['name']} ({p['show']}) - {p['traits']}"
            for pid, p in PERSONAS.items()
        ])

        prompt = f"""Based on this person's chat vibe analysis and vocabulary, match them to ONE cartoon character.

Consider both their emotional patterns AND their word choices - if their vocabulary matches how a character speaks, weight that heavily.

{emotion_summary}

PERSONAS (pick ONE by ID):
{persona_options}

Output ONLY in this format:
persona_id: [id from list above]
match_reason: [1-2 sentence explanation of why this persona fits, mention specific words if relevant]
confidence: [0.0-1.0]
yearly_vibe: [A fun, Gen-Z style 1-sentence summary of their overall vibe for the year, like a Spotify Wrapped tagline]
"""

        try:
            response_text = await self._chat(prompt, temperature=0.7, max_tokens=256)
            print(f"[LLM Persona Response]\n{response_text}\n")

            result = {
                'persona_id': 'jake',
                'match_reason': '',
                'confidence': 0.0,
                'yearly_vibe': ''
            }

            for line in response_text.strip().split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().lower().replace(' ', '_')
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
                    elif key == 'yearly_vibe':
                        result['yearly_vibe'] = value

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
                'confidence': 0.0,
                'yearly_vibe': ''
            }


# Alias for backward compatibility
GeminiAnalyzer = LLMAnalyzer
