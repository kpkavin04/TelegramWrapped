import { motion } from "framer-motion"
import { SimpleCheckbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export interface Chat {
  id: string
  name: string
  avatar?: string
  messageCount: number
  type: "private" | "group" | "channel"
}

interface ChatCardProps {
  chat: Chat
  selected: boolean
  onSelect: (selected: boolean) => void
  index?: number
}

export function ChatCard({ chat, selected, onSelect, index = 0 }: ChatCardProps) {
  const initials = chat.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onSelect(!selected)}
      className={cn(
        "relative p-4 rounded-xl border border-border bg-surface cursor-pointer transition-all hover:bg-surface-elevated hover:border-primary/50",
        selected && "border-primary bg-primary-muted"
      )}
    >
      <div className="absolute top-3 right-3">
        <SimpleCheckbox checked={selected} onChange={onSelect} />
      </div>

      <div className="flex items-center gap-3">
        {chat.avatar ? (
          <img
            src={chat.avatar}
            alt={chat.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text-primary truncate">{chat.name}</h3>
          <p className="text-sm text-text-secondary">
            {chat.messageCount.toLocaleString()} messages
          </p>
        </div>
      </div>

      <div className="mt-2">
        <span className="text-xs px-2 py-1 rounded-full bg-surface-elevated text-text-muted">
          {chat.type}
        </span>
      </div>
    </motion.div>
  )
}
