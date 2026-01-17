import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { FunnyQuotes } from "@/components/shared/FunnyQuotes"
import { useApi } from "@/hooks/useApi"

export function LoadingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { getWrappedStatus } = useApi()
  const taskId = location.state?.taskId

  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!taskId) {
      navigate("/chats")
      return
    }

    const pollStatus = async () => {
      try {
        const result = await getWrappedStatus(taskId)

        if (result.progress) {
          setProgress(result.progress)
        }

        if (result.status === "completed") {
          navigate("/wrapped", { state: { taskId, result: result.result } })
        } else if (result.status === "failed") {
          setError("Generation failed. Please try again.")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      }
    }

    const interval = setInterval(pollStatus, 2000)
    pollStatus() // Initial call

    return () => clearInterval(interval)
  }, [taskId, navigate, getWrappedStatus])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <p className="text-error text-lg">{error}</p>
          <button
            onClick={() => navigate("/chats")}
            className="text-primary hover:underline"
          >
            Go back and try again
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 max-w-md w-full"
      >
        {/* Animated logo */}
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
          className="mx-auto"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-[#00c6ff] flex items-center justify-center">
            <LoadingSpinner size="lg" className="border-white/30 border-t-white" />
          </div>
        </motion.div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Creating Your Wrapped
          </h1>
          <FunnyQuotes />
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-text-muted text-sm">
            {progress > 0 ? `${Math.round(progress)}% complete` : "Starting..."}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.2,
                repeat: Infinity,
              }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
