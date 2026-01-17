export interface ChatResult {
  chat_id: string
  chat_name: string
  message_count: number
  sentiment_breakdown: Record<string, number>
}

export interface WrappedResult {
  per_chat: ChatResult[]
  aggregate: {
    user_id: string
    total_chats: number
    total_messages: number
    word_frequency: Record<string, number>
    emoji_frequency: Record<string, number>
    wordcloud_image: string
    sentiment_by_month: Record<
      string,
      {
        primary: string
        secondary: string
        confidence: number
        vibe_summary: string
      }
    >
    persona: {
      persona_id: string
      persona_name: string
      show: string
      traits: string
      match_reason: string
      confidence: number
    }
    top_words: string[]
    top_emojis: string[]
    hour_distribution?: Record<number, number>
    angriest_day?: string
  }
}

export interface Chat {
  id: string
  name: string
  avatar?: string
  messageCount: number
  type: "private" | "group" | "channel"
}
