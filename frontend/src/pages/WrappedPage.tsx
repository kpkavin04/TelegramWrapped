import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import Confetti from "react-confetti"
import { ChevronLeft, ChevronRight, Share2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SlideContainer } from "@/components/wrapped/SlideContainer"
import { ProgressDots } from "@/components/wrapped/ProgressDots"
import { NumberCounter } from "@/components/wrapped/NumberCounter"
import { EmojiDisplay } from "@/components/wrapped/EmojiDisplay"
import { PersonaCard } from "@/components/wrapped/PersonaCard"
import { WordCloud } from "@/components/wrapped/WordCloud"
import { ActiveChatsChart } from "@/components/wrapped/ActiveChatsChart"
import { DownloadModal } from "@/components/wrapped/DownloadModal"
import { useSlideNavigation } from "@/hooks/useSlideNavigation"
import type { WrappedResult, Chat } from "@/lib/types"

const TOTAL_SLIDES = 9

export function WrappedPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const data: WrappedResult | null = location.state?.result || null

  // Get chats from localStorage (stored by ChatsPage before navigation)
  const chats: Chat[] = JSON.parse(localStorage.getItem("wrapped_chats") || "[]")

  // Create chat ID to name lookup
  const chatNameMap = new Map(chats.map((c) => [c.id, c.name]))

  // Modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false)

  const { currentSlide, direction, goToSlide, next, prev, isFirst, isLast } =
    useSlideNavigation({
      totalSlides: TOTAL_SLIDES,
    })

  useEffect(() => {
    if (!data) {
      navigate("/chats")
    }
  }, [data, navigate])

  // Trigger confetti on slide 3 (top words podium) after 1st place reveal
  useEffect(() => {
    if (currentSlide === 3) {
      const timer = setTimeout(() => {
        setShowConfetti(true)
        // Stop confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000)
      }, 3000) // Trigger after 1st place is revealed (2.5s delay + 0.5s buffer)
      return () => clearTimeout(timer)
    } else {
      setShowConfetti(false)
    }
  }, [currentSlide])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Telegram Wrapped 2025",
        text: "Check out my Telegram Wrapped!",
        url: window.location.href,
      })
    }
  }

  if (!data) return null

  const { aggregate, per_chat } = data

  console.log("Aggregate data:", aggregate)
  console.log("Per-chat data:", per_chat)
  console.log("Chats from state:", chats)
  console.log("ChatNameMap:", Object.fromEntries(chatNameMap))

  // Safe access with defaults
  const safeAggregate = aggregate || {}
  const safePerChat = per_chat || []

  const topEmojis = safeAggregate.top_emojis?.slice(0, 3).map((emoji) => ({
    emoji,
    count: safeAggregate.emoji_frequency?.[emoji] || 0,
  })) || []

  // Calculate total words from word_frequency
  const totalWords = Object.values(safeAggregate.word_frequency || {}).reduce(
    (sum: number, count) => sum + (count as number),
    0
  )

  // Download modal data - use per_chat data (same as ActiveChatsChart)
  const topChatsData = safePerChat
    .map((c) => {
      const chatId = c.chat_ids?.[0] || ""
      return {
        name: chatNameMap.get(chatId) || chatId || "Chat",
        messageCount: c.message_stats?.user_count || 0,
      }
    })
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 5)

  const downloadData = {
    totalMessages: safeAggregate.total_messages || 0,
    totalWords,
    persona: safeAggregate.persona || { persona_name: "Unknown", show: "", traits: "", match_reason: "" },
    topChats: topChatsData,
    topWords: safeAggregate.top_words?.slice(0, 5) || [],
  }

  const renderSlide = () => {
    switch (currentSlide) {
      case 0: // Intro
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4"
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                backgroundImage: "linear-gradient(90deg, #0088cc, #00c6ff, #0088cc)",
                backgroundSize: "200% auto",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Your 2025
            </motion.h1>
            <h2 className="text-3xl md:text-5xl font-bold text-text-primary">
              Telegram Wrapped
            </h2>
            <p className="text-text-secondary mt-8">
              Tap or use arrow keys to continue
            </p>
          </motion.div>
        )

      case 1: // Total messages
        return (
          <div className="text-center space-y-6">
            <h2 className="text-2xl text-text-secondary">You sent</h2>
            <NumberCounter
              value={safeAggregate.total_messages || 0}
              className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary to-[#00c6ff] bg-clip-text text-transparent"
            />
            <p className="text-2xl text-text-secondary">messages this year</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="text-text-muted mt-8"
            >
              Across {safeAggregate.total_chats || 0} conversations
            </motion.p>
          </div>
        )

      case 2: // Most active chats
        return (
          <div className="text-center space-y-8 w-full max-w-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
              Your Most Active Chats
            </h2>
            <ActiveChatsChart
              chats={safePerChat.map((c) => {
                const chatId = c.chat_ids?.[0] || ""
                return {
                  name: chatNameMap.get(chatId) || chatId || "Chat",
                  messageCount: c.message_stats?.user_count || 0,
                }
              })}
            />
          </div>
        )

      case 3: // Top 3 words podium
        const topThreeWords = safeAggregate.top_words?.slice(0, 3) || []
        const podiumOrder = [1, 0, 2] // 2nd, 1st, 3rd (left to right)
        const podiumHeights = [140, 200, 100] // 2nd, 1st, 3rd in pixels
        const podiumColors = [
          "from-gray-400 to-gray-300", // Silver (2nd)
          "from-yellow-400 to-yellow-300", // Gold (1st)
          "from-amber-600 to-amber-500", // Bronze (3rd)
        ]
        const revealDelays = [1.5, 2.5, 0.5] // 1st last, 2nd middle, 3rd first
        const medals = ["🥈", "🥇", "🥉"]

        return (
          <div className="text-center space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-bold text-text-primary"
            >
              Your Top Words
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-text-secondary"
            >
              The words that defined your year
            </motion.p>

            {/* Podium */}
            <div className="flex items-end justify-center gap-3 mt-8">
              {podiumOrder.map((wordIndex, podiumPos) => {
                const word = topThreeWords[wordIndex]
                const count = safeAggregate.word_frequency?.[word] || 0
                if (!word) return null

                return (
                  <motion.div
                    key={word}
                    initial={{ opacity: 0, y: 100, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: revealDelays[podiumPos],
                      duration: 0.6,
                      type: "spring",
                      stiffness: 100,
                    }}
                    className="flex flex-col items-center"
                  >
                    {/* Medal */}
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: revealDelays[podiumPos] + 0.3,
                        type: "spring",
                        stiffness: 200,
                      }}
                      className="text-4xl mb-2"
                    >
                      {medals[podiumPos]}
                    </motion.span>

                    {/* Word */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: revealDelays[podiumPos] + 0.4 }}
                      className="mb-3 text-center"
                    >
                      <div className="text-xl md:text-2xl font-bold text-text-primary">
                        {word}
                      </div>
                      <div className="text-sm text-text-muted">
                        {count.toLocaleString()}x
                      </div>
                    </motion.div>

                    {/* Podium block */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: podiumHeights[podiumPos] }}
                      transition={{
                        delay: revealDelays[podiumPos],
                        duration: 0.8,
                        type: "spring",
                        stiffness: 80,
                      }}
                      className={`w-28 md:w-36 bg-gradient-to-t ${podiumColors[podiumPos]} rounded-t-xl flex items-center justify-center shadow-lg`}
                    >
                      <span className="text-4xl md:text-5xl font-bold text-white/90 drop-shadow-md">
                        {wordIndex + 1}
                      </span>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>

            {/* Winner celebration effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3.2, duration: 0.5 }}
              className="text-text-muted text-sm mt-4"
            >
              ✨ "{topThreeWords[0]}" is your word of the year! ✨
            </motion.div>
          </div>
        )

      case 4: // Top emojis
        return (
          <div className="text-center space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
              Your Favorite Emojis
            </h2>
            <EmojiDisplay emojis={topEmojis} />
          </div>
        )

      case 5: // Persona
        return (
          <div className="text-center">
            <h2 className="text-xl text-text-secondary mb-6">
              Based on your texts...
            </h2>
            <PersonaCard persona={safeAggregate.persona} />
          </div>
        )

      case 6: // Word cloud
        return (
          <div className="text-center space-y-6 w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
              Your Word Cloud
            </h2>
            <WordCloud wordFrequency={safeAggregate.word_frequency || {}} />
          </div>
        )

      case 7: // Monthly sentiment details
        const monthNames8 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const moodEmojis: Record<string, string> = {
          "chaotic energy": "🤪",
          "wholesome": "🥰",
          "unhinged": "😈",
          "dramatic": "😱",
          "chill": "😌",
          "existential": "🤔",
          "passive aggressive": "😒",
          "depressed": "😔",
          "angry": "😤",
          "happy": "😊",
          "sad": "😢",
          "excited": "🎉",
          "anxious": "😰",
          "peaceful": "☮️",
          "romantic": "💕",
          "nostalgic": "🥹",
          "confident": "😎",
          "grateful": "🙏",
          "playful": "😜",
          "cozy": "🛋️",
        }
        const getMoodEmoji = (mood: string) => {
          const key = mood?.toLowerCase() || ""
          return moodEmojis[key] || "✨"
        }
        const sentimentEntries = Object.entries(safeAggregate.sentiment_by_month || {})
          .map(([key, val]) => {
            const monthIndex = parseInt(key, 10) - 1
            return {
              month: monthNames8[monthIndex] || key,
              monthIndex,
              ...val,
            }
          })
          .sort((a, b) => a.monthIndex - b.monthIndex) // Sort chronologically

        return (
          <div className="text-center w-full max-w-7xl px-2">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
              Monthly Vibes
            </h2>
            <p className="text-text-secondary text-base mt-2 mb-8">
              Your emotional journey through the year
            </p>

            {/* Timeline container */}
            <div className="flex flex-col gap-3">
              {/* Top row - even months (0, 2, 4...) */}
              <div className="flex justify-around">
                {sentimentEntries.map((entry, i) => (
                  <motion.div
                    key={entry.month + "-top"}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: i % 2 === 0 ? 1 : 0, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex flex-col items-center min-w-[80px]"
                    style={{ visibility: i % 2 === 0 ? "visible" : "hidden" }}
                  >
                    <span className="text-3xl mb-1">{getMoodEmoji(entry.primary)}</span>
                    <span className="text-sm text-primary font-semibold capitalize leading-tight">
                      {entry.primary}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Middle row - timeline with months */}
              <div className="relative py-4">
                {/* Timeline line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 transform -translate-y-1/2 rounded-full" />

                {/* Dots and month labels */}
                <div className="flex justify-around relative">
                  {sentimentEntries.map((entry, i) => (
                    <motion.div
                      key={entry.month + "-dot"}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-4 h-4 rounded-full bg-primary border-2 border-background" />
                      <span className="text-base text-text-muted mt-2 font-semibold">
                        {entry.month}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bottom row - odd months (1, 3, 5...) */}
              <div className="flex justify-around">
                {sentimentEntries.map((entry, i) => (
                  <motion.div
                    key={entry.month + "-bottom"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: i % 2 === 1 ? 1 : 0, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex flex-col items-center min-w-[80px]"
                    style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}
                  >
                    <span className="text-sm text-primary font-semibold capitalize leading-tight">
                      {entry.primary}
                    </span>
                    <span className="text-3xl mt-1">{getMoodEmoji(entry.primary)}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )

      case 8: // Final summary
        return (
          <div className="text-center space-y-8 max-w-md">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="text-6xl"
            >
              🎉
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              That's a Wrap!
            </h2>
            <p className="text-text-secondary">
              Thanks for an amazing year of conversations
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-[#0099e6] flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDownloadModal(true)
                }}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Confetti for top words reveal */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
          gravity={0.3}
          colors={["#FFD700", "#FFA500", "#FF6347", "#00CED1", "#9370DB", "#32CD32"]}
        />
      )}

      <div
        className="h-screen flex flex-col bg-background cursor-pointer overflow-hidden"
        onClick={next}
      >
        {/* Main content */}
        <div className="flex-1 relative min-h-0">
          <SlideContainer slideKey={currentSlide} direction={direction}>
            {renderSlide()}
          </SlideContainer>
        </div>

        {/* Navigation */}
        <div className="p-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            disabled={isFirst}
            className="opacity-50 hover:opacity-100 disabled:opacity-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <ProgressDots
            total={TOTAL_SLIDES}
            current={currentSlide}
            onDotClick={(i) => {
              goToSlide(i)
            }}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            disabled={isLast}
            className="opacity-50 hover:opacity-100 disabled:opacity-20"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        data={downloadData}
      />
    </>
  )
}
