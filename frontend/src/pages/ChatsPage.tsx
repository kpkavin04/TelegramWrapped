import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatGrid } from "@/components/chats/ChatGrid"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useApi } from "@/hooks/useApi"
import type { Chat } from "@/lib/types"

const LOADING_MESSAGES = [
  { text: "Cooking your Telegram Wrapped...", emoji: "👨‍🍳" },
  { text: "Reading through your messages...", emoji: "👀" },
  { text: "Wow, you text a LOT...", emoji: "😳" },
  { text: "Finding your most used words...", emoji: "🔍" },
  { text: "That was spicy...", emoji: "🌶️" },
  { text: "DAMMMMN...", emoji: "😱" },
  { text: "Calculating your vibe...", emoji: "✨" },
  { text: "No judgment here...", emoji: "🙈" },
  { text: "Almost there...", emoji: "🏃" },
  { text: "This is getting interesting...", emoji: "👀" },
  { text: "Wrapping it all up...", emoji: "🎁" },
]

export function ChatsPage() {
  const navigate = useNavigate()
  const { getChats, generateWrapped, isAuthenticated } = useApi()

  const [chats, setChats] = useState<Chat[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)

  // Rotate loading messages
  useEffect(() => {
    if (!generating) {
      setLoadingMsgIndex(0)
      return
    }

    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [generating])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/")
      return
    }

    const loadChats = async () => {
      setLoading(true)
      try {
        const result = await getChats()
        console.log("Loaded chats from API:", result.chats)
        setChats(result.chats)
        // Store immediately for WrappedPage to use later
        localStorage.setItem("wrapped_chats", JSON.stringify(result.chats))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chats")
      } finally {
        setLoading(false)
      }
    }

    loadChats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const handleSelectAll = () => {
    if (selectedIds.size === chats.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(chats.map((c) => c.id)))
    }
  }

  const handleGenerate = async () => {
    if (selectedIds.size === 0) return

    setGenerating(true)
    setError(null)

    try {
      // generateWrapped now returns result directly
      console.log("Chats state before generate:", chats)
      const result = await generateWrapped(Array.from(selectedIds))
      // Store chats in localStorage for WrappedPage to use
      console.log("Chats to store:", chats)
      localStorage.setItem("wrapped_chats", JSON.stringify(chats))
      console.log("Stored in localStorage:", localStorage.getItem("wrapped_chats"))
      navigate("/wrapped", { state: { result } })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate wrapped")
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show loading overlay while generating
  if (generating) {
    const currentMsg = LOADING_MESSAGES[loadingMsgIndex]

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          {/* Animated emoji */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-[#00c6ff] flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
              <AnimatePresence mode="wait">
                <motion.span
                  key={loadingMsgIndex}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.3 }}
                  className="text-5xl"
                >
                  {currentMsg.emoji}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              Creating Your Wrapped
            </h1>

            {/* Rotating message */}
            <div className="h-8 relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMsgIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-text-secondary text-lg absolute inset-x-0"
                >
                  {currentMsg.text}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-4">
            {LOADING_MESSAGES.slice(0, 5).map((_, i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i <= loadingMsgIndex % 5 ? "bg-primary" : "bg-text-muted/30"
                }`}
                animate={{
                  scale: i === loadingMsgIndex % 5 ? [1, 1.3, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Select Chats
            </h1>
            <p className="text-text-secondary mt-1">
              Choose which conversations to analyze
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="flex items-center gap-2"
            >
              {selectedIds.size === chats.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedIds.size === chats.length ? "Deselect All" : "Select All"}
            </Button>

            <motion.div
              animate={{ scale: selectedIds.size > 0 ? 1 : 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button
                onClick={handleGenerate}
                disabled={selectedIds.size === 0 || generating}
                className="bg-gradient-to-r from-primary to-[#0099e6] flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Wrapped
                {selectedIds.size > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                    {selectedIds.size}
                  </span>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-lg bg-error/10 border border-error/20 text-error"
          >
            {error}
          </motion.div>
        )}

        {/* Chat Grid */}
        <ChatGrid
          chats={chats}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>
    </div>
  )
}
