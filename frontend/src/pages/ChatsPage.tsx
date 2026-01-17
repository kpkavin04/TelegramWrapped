import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Sparkles, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatGrid } from "@/components/chats/ChatGrid"
import { Pagination } from "@/components/chats/Pagination"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useApi } from "@/hooks/useApi"
import type { Chat } from "@/lib/types"

const ITEMS_PER_PAGE = 12

export function ChatsPage() {
  const navigate = useNavigate()
  const { getChats, generateWrapped, isAuthenticated } = useApi()

  const [chats, setChats] = useState<Chat[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/")
      return
    }

    const loadChats = async () => {
      setLoading(true)
      try {
        const result = await getChats(currentPage, ITEMS_PER_PAGE)
        setChats(result.chats)
        setTotalPages(result.pages)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chats")
      } finally {
        setLoading(false)
      }
    }

    loadChats()
  }, [currentPage, isAuthenticated, navigate, getChats])

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
    try {
      const result = await generateWrapped(Array.from(selectedIds))
      navigate("/loading", { state: { taskId: result.task_id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start generation")
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
                {generating ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
