import { motion } from "framer-motion"

interface ChatData {
  name: string
  messageCount: number
}

interface ActiveChatsChartProps {
  chats: ChatData[]
}

export function ActiveChatsChart({ chats }: ActiveChatsChartProps) {
  const topChats = chats
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 5)

  const maxCount = topChats[0]?.messageCount || 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-md space-y-4"
    >
      {topChats.map((chat, index) => (
        <motion.div
          key={chat.name}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.2 }}
          className="space-y-2"
        >
          <div className="flex justify-between items-center">
            <span className="text-text-primary font-medium truncate max-w-[200px]">
              {chat.name}
            </span>
            <span className="text-text-secondary text-sm">
              {chat.messageCount.toLocaleString()}
            </span>
          </div>
          <div className="h-3 bg-surface-elevated rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(chat.messageCount / maxCount) * 100}%` }}
              transition={{
                delay: index * 0.2 + 0.3,
                duration: 0.8,
                ease: "easeOut",
              }}
              className="h-full bg-gradient-to-r from-primary to-[#00c6ff] rounded-full"
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
