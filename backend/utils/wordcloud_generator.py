"""
Word Cloud Generator for User Messages
Generates visual word clouds from text data
"""

from wordcloud import WordCloud
import matplotlib.pyplot as plt
from io import BytesIO
import base64
from typing import Dict, Optional


class WordCloudGenerator:
    """Generate word clouds from text"""

    def __init__(
        self,
        width: int = 800,
        height: int = 400,
        background_color: str = 'white',
        colormap: str = 'viridis'
    ):
        self.width = width
        self.height = height
        self.background_color = background_color
        self.colormap = colormap

    def generate_from_text(self, text: str, max_words: int = 100) -> str:
        """Generate word cloud from text, return as base64 image

        Args:
            text: Input text to generate word cloud from
            max_words: Maximum number of words in cloud

        Returns:
            Base64 encoded PNG image string
        """
        if not text or not text.strip():
            return self._generate_empty_wordcloud()

        # Create word cloud
        wordcloud = WordCloud(
            width=self.width,
            height=self.height,
            background_color=self.background_color,
            colormap=self.colormap,
            max_words=max_words,
            relative_scaling=0.5,
            min_font_size=10
        ).generate(text)

        # Convert to image
        return self._wordcloud_to_base64(wordcloud)

    def generate_from_frequencies(self, frequencies: Dict[str, int]) -> str:
        """Generate word cloud from word frequency dict

        Args:
            frequencies: {word: count} dictionary

        Returns:
            Base64 encoded PNG image string
        """
        if not frequencies:
            return self._generate_empty_wordcloud()

        # Create word cloud from frequencies
        wordcloud = WordCloud(
            width=self.width,
            height=self.height,
            background_color=self.background_color,
            colormap=self.colormap,
            relative_scaling=0.5,
            min_font_size=10
        ).generate_from_frequencies(frequencies)

        return self._wordcloud_to_base64(wordcloud)

    def _wordcloud_to_base64(self, wordcloud: WordCloud) -> str:
        """Convert WordCloud to base64 string"""
        # Create figure
        plt.figure(figsize=(self.width/100, self.height/100), dpi=100)
        plt.imshow(wordcloud, interpolation='bilinear')
        plt.axis('off')
        plt.tight_layout(pad=0)

        # Save to bytes
        buffer = BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight', pad_inches=0)
        plt.close()

        # Encode to base64
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.read()).decode('utf-8')

        return f"data:image/png;base64,{img_base64}"

    def _generate_empty_wordcloud(self) -> str:
        """Generate placeholder for empty data"""
        # Create empty figure
        plt.figure(figsize=(self.width/100, self.height/100), dpi=100)
        plt.text(
            0.5, 0.5,
            'No data available',
            ha='center', va='center',
            fontsize=20, color='gray'
        )
        plt.axis('off')

        buffer = BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight')
        plt.close()

        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.read()).decode('utf-8')

        return f"data:image/png;base64,{img_base64}"

    def save_to_file(self, text: str, output_path: str, max_words: int = 100):
        """Generate and save word cloud to file

        Args:
            text: Input text
            output_path: Path to save PNG file
            max_words: Maximum words in cloud
        """
        wordcloud = WordCloud(
            width=self.width,
            height=self.height,
            background_color=self.background_color,
            colormap=self.colormap,
            max_words=max_words,
            relative_scaling=0.5,
            min_font_size=10
        ).generate(text)

        plt.figure(figsize=(self.width/100, self.height/100), dpi=100)
        plt.imshow(wordcloud, interpolation='bilinear')
        plt.axis('off')
        plt.tight_layout(pad=0)
        plt.savefig(output_path, bbox_inches='tight', pad_inches=0)
        plt.close()


# Preset themes
THEMES = {
    'default': {'background_color': 'white', 'colormap': 'viridis'},
    'dark': {'background_color': 'black', 'colormap': 'plasma'},
    'ocean': {'background_color': 'white', 'colormap': 'ocean'},
    'sunset': {'background_color': 'white', 'colormap': 'YlOrRd'},
    'forest': {'background_color': 'white', 'colormap': 'Greens'},
    'purple': {'background_color': 'white', 'colormap': 'Purples'},
}


def generate_wordcloud(
    text: str,
    theme: str = 'default',
    max_words: int = 100
) -> str:
    """Quick function to generate word cloud with theme

    Args:
        text: Input text
        theme: Color theme (default, dark, ocean, sunset, forest, purple)
        max_words: Max words to display

    Returns:
        Base64 encoded image string
    """
    theme_config = THEMES.get(theme, THEMES['default'])
    generator = WordCloudGenerator(**theme_config)
    return generator.generate_from_text(text, max_words)
