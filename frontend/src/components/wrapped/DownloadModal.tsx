import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, Share2, Loader2 } from "lucide-react"
import html2canvas from "html2canvas"
import { Button } from "@/components/ui/button"
import { WrappedSummary } from "./WrappedSummary"

interface ChatData {
  name: string
  messageCount: number
}

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  data: {
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
  }
}

export function DownloadModal({ isOpen, onClose, data }: DownloadModalProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing] = useState(false)

  const generateImage = async (): Promise<Blob | null> => {
    if (!captureRef.current) return null

    const canvas = await html2canvas(captureRef.current, {
      backgroundColor: "#0f0f1a",
      scale: 2,
      useCORS: true,
      logging: false,
    })

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png")
    })
  }

  const handleDownload = async () => {
    if (!captureRef.current) return

    setDownloading(true)
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#0f0f1a",
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = "telegram-wrapped-2025.png"
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Failed to generate image:", err)
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    setSharing(true)
    try {
      const blob = await generateImage()
      if (!blob) throw new Error("Failed to generate image")

      const file = new File([blob], "telegram-wrapped-2025.png", { type: "image/png" })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Telegram Wrapped 2025",
          text: "Check out my Telegram Wrapped!",
        })
      } else if (navigator.share) {
        await navigator.share({
          title: "My Telegram Wrapped 2025",
          text: "Check out my Telegram Wrapped!",
          url: window.location.href,
        })
      } else {
        handleDownload()
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Failed to share:", err)
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-surface rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Preview - larger scale */}
            <div className="flex justify-center overflow-hidden rounded-xl mb-4">
              <div ref={previewRef} className="transform scale-[0.85] origin-top">
                <WrappedSummary {...data} />
              </div>
            </div>

            {/* Action buttons - below image */}
            <div className="flex gap-3">
              <Button
                onClick={handleDownload}
                disabled={downloading || sharing}
                className="flex-1 bg-gradient-to-r from-primary to-[#0099e6] flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download
                  </>
                )}
              </Button>

              <Button
                onClick={handleShare}
                disabled={downloading || sharing}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                {sharing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share
                  </>
                )}
              </Button>
            </div>

            {/* Hidden full-size capture element - positioned off-screen */}
            <div
              style={{
                position: "fixed",
                left: "-9999px",
                top: 0,
                pointerEvents: "none",
              }}
            >
              <WrappedSummary ref={captureRef} {...data} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
