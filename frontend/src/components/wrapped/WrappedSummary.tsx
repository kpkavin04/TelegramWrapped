import { forwardRef } from "react"

interface ChatData {
  name: string
  messageCount: number
}

interface WrappedSummaryProps {
  totalMessages: number
  totalWords: number
  persona: {
    persona_name: string
    show: string
    traits: string
    match_reason: string
  }
  topChats: ChatData[]
  topWords: string[]
  year?: number
}

export const WrappedSummary = forwardRef<HTMLDivElement, WrappedSummaryProps>(
  ({ totalMessages, totalWords, persona, topChats, topWords, year = 2025 }, ref) => {
    const maxChatCount = topChats[0]?.messageCount || 1

    return (
      <div
        ref={ref}
        className="w-[420px] p-5 flex flex-col"
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)",
        }}
      >
        {/* Header with Year */}
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl font-black text-[#0088cc] leading-none">
            {year}
          </div>
          <div className="flex-1 h-1 bg-gradient-to-r from-[#0088cc] to-transparent rounded-full" />
        </div>

        {/* Persona Section */}
        <div className="mb-4">
          <div className="bg-gradient-to-br from-[#0088cc]/20 to-[#00c6ff]/5 rounded-xl p-3 border border-[#0088cc]/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0088cc] to-[#00c6ff] flex items-center justify-center text-xl font-black text-white shadow-lg flex-shrink-0">
                {persona.persona_name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-white leading-tight truncate">
                  {persona.persona_name}
                </div>
                <div className="text-xs text-[#0088cc]">
                  {persona.show}
                </div>
              </div>
            </div>

            {persona.traits && (
              <p className="text-[10px] text-[#00c6ff]/80 mt-2 leading-relaxed">
                {persona.traits}
              </p>
            )}

            {persona.match_reason && (
              <p className="text-[10px] text-gray-300/70 mt-1.5 leading-relaxed italic">
                "{persona.match_reason}"
              </p>
            )}
          </div>
        </div>

        {/* Top Chats */}
        <div className="mb-4">
          <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">
            Top Chats
          </div>
          <div className="space-y-1.5">
            {topChats.slice(0, 4).map((chat, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[#0088cc] font-bold text-xs w-3">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-white text-xs font-medium truncate pr-2">
                      {chat.name}
                    </span>
                    <span className="text-gray-400 text-[10px] flex-shrink-0">
                      {chat.messageCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0088cc] to-[#00c6ff] rounded-full"
                      style={{ width: `${(chat.messageCount / maxChatCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Words - Single Line */}
        <div className="mb-4">
          <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">
            Top Words
          </div>
          <div className="flex gap-1.5 justify-between">
            {topWords.slice(0, 5).map((word, i) => (
              <div
                key={i}
                className="flex items-center gap-1 bg-white/5 rounded-md px-2 py-1"
              >
                <span className="text-[#00c6ff] font-bold text-[10px]">{i + 1}</span>
                <span className="text-white text-[10px] font-medium">{word}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section - Full Width Centered */}
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">
                Messages Sent
              </div>
              <div className="text-2xl font-black text-white">
                {totalMessages.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">
                Words Typed
              </div>
              <div className="text-2xl font-black text-[#0088cc]">
                {totalWords.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-[#0088cc] to-[#00c6ff]" />
            <span className="text-[9px] text-gray-500 font-medium tracking-wide">
              TELEGRAMWRAPPED.COM
            </span>
          </div>
        </div>
      </div>
    )
  }
)

WrappedSummary.displayName = "WrappedSummary"
