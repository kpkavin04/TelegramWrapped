import { motion } from "framer-motion"

interface EmojiDisplayProps {
  emojis: Array<{ emoji: string; count: number }>
}

export function EmojiDisplay({ emojis }: EmojiDisplayProps) {
  return (
    <div className="flex flex-col gap-6 items-center">
      {emojis.slice(0, 3).map((item, index) => (
        <motion.div
          key={item.emoji}
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            delay: index * 0.3,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="flex items-center gap-4"
        >
          <motion.span
            className="text-6xl md:text-7xl"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              delay: index * 0.3 + 0.5,
              duration: 0.4,
              ease: "easeInOut",
            }}
          >
            {item.emoji}
          </motion.span>
          <div className="text-left">
            <p className="text-2xl font-bold text-text-primary">
              {item.count.toLocaleString()}
            </p>
            <p className="text-sm text-text-secondary">times used</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
