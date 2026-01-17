import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Share2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SlideContainer } from "@/components/wrapped/SlideContainer"
import { ProgressDots } from "@/components/wrapped/ProgressDots"
import { NumberCounter } from "@/components/wrapped/NumberCounter"
import { EmojiDisplay } from "@/components/wrapped/EmojiDisplay"
import { PersonaCard } from "@/components/wrapped/PersonaCard"
import { WordCloud } from "@/components/wrapped/WordCloud"
import { SentimentChart } from "@/components/wrapped/SentimentChart"
import { TimeOfDayChart } from "@/components/wrapped/TimeOfDayChart"
import { ActiveChatsChart } from "@/components/wrapped/ActiveChatsChart"
import { useSlideNavigation } from "@/hooks/useSlideNavigation"
import { useApi } from "@/hooks/useApi"
import type { WrappedResult } from "@/lib/types"

const TOTAL_SLIDES = 10

export function WrappedPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { getWrappedResult } = useApi()

  const [data, setData] = useState<WrappedResult | null>(
    location.state?.result || null
  )
  const taskId = location.state?.taskId

  const { currentSlide, direction, goToSlide, next, prev, isFirst, isLast } =
    useSlideNavigation({
      totalSlides: TOTAL_SLIDES,
    })

  useEffect(() => {
    if (!data && taskId) {
      getWrappedResult(taskId)
        .then(setData)
        .catch(() => navigate("/chats"))
    } else if (!data && !taskId) {
      navigate("/chats")
    }
  }, [data, taskId, navigate, getWrappedResult])

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: "My Telegram Wrapped 2024",
        text: "Check out my Telegram Wrapped!",
        url: window.location.href,
      })
    }
  }

  if (!data) return null

  const { aggregate, per_chat } = data
  const topEmojis = aggregate.top_emojis?.slice(0, 3).map((emoji) => ({
    emoji,
    count: aggregate.emoji_frequency[emoji] || 0,
  })) || []

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
              Your 2024
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
              value={aggregate.total_messages}
              className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary to-[#00c6ff] bg-clip-text text-transparent"
            />
            <p className="text-2xl text-text-secondary">messages this year</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="text-text-muted mt-8"
            >
              Across {aggregate.total_chats} conversations
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
              chats={per_chat.map((c) => ({
                name: c.chat_name,
                messageCount: c.message_count,
              }))}
            />
          </div>
        )

      case 3: // Top emojis
        return (
          <div className="text-center space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
              Your Favorite Emojis
            </h2>
            <EmojiDisplay emojis={topEmojis} />
          </div>
        )

      case 4: // Persona
        return (
          <div className="text-center">
            <h2 className="text-xl text-text-secondary mb-6">
              Based on your texts...
            </h2>
            <PersonaCard persona={aggregate.persona} />
          </div>
        )

      case 5: // Word cloud
        return (
          <div className="text-center space-y-6 w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
              Your Word Cloud
            </h2>
            {aggregate.wordcloud_image ? (
              <WordCloud imageBase64={aggregate.wordcloud_image} />
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {aggregate.top_words?.slice(0, 20).map((word, i) => (
                  <motion.span
                    key={word}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full"
                    style={{ fontSize: `${Math.max(12, 24 - i)}px` }}
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        )

      case 6: // Sentiment by month
        return (
          <div className="text-center space-y-6 w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
              Your Vibe Through The Year
            </h2>
            <SentimentChart data={aggregate.sentiment_by_month} />
          </div>
        )

      case 7: // Time of day
        return (
          <div className="text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
              When You're Most Active
            </h2>
            <TimeOfDayChart hourData={aggregate.hour_distribution || {}} />
          </div>
        )

      case 8: // Angriest day
        return (
          <div className="text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
              Your Most Chaotic Day
            </h2>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-6xl"
            >
              😤
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-text-secondary"
            >
              {aggregate.angriest_day || "You kept your cool all year!"}
            </motion.p>
          </div>
        )

      case 9: // Final summary
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
                onClick={() => {
                  // TODO: Download as image
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
    <div
      className="min-h-screen flex flex-col bg-background cursor-pointer"
      onClick={next}
    >
      {/* Main content */}
      <div className="flex-1 relative">
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
  )
}
