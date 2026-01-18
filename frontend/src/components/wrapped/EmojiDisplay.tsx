import { motion } from "framer-motion"
import { useState, useMemo } from "react"

interface EmojiDisplayProps {
  emojis: Array<{ emoji: string; count: number }>
}

// Convert emoji to Twemoji CDN URL
function emojiToTwemojiUrl(emoji: string): string {
  const codePoints = [...emoji]
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter((cp) => cp && cp !== "fe0f") // Remove variation selector
    .join("-")
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codePoints}.png`
}

// Check if emoji is likely valid (basic heuristic)
function isValidEmoji(emoji: string): boolean {
  if (!emoji || emoji.length === 0) return false
  const stripped = emoji.replace(/[\uFE0F\u200D]/g, "")
  return stripped.length > 0 && !/^[\u{1F3FB}-\u{1F3FF}]$/u.test(stripped)
}

function TwemojiImage({ emoji, size = 72 }: { emoji: string; size?: number }) {
  const [error, setError] = useState(false)

  if (!isValidEmoji(emoji) || error) {
    return <span style={{ fontSize: size * 0.8 }}>✨</span>
  }

  return (
    <img
      src={emojiToTwemojiUrl(emoji)}
      alt={emoji}
      width={size}
      height={size}
      onError={() => setError(true)}
      className="inline-block"
      style={{ width: size, height: size }}
    />
  )
}

// Rank badges for top 3
const rankBadges = ["🥇", "🥈", "🥉"]

// Generate rainfall particles
function generateRaindrops(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // % from left
    delay: Math.random() * 2, // stagger start
    duration: 1.5 + Math.random() * 1, // fall duration
    size: 24 + Math.random() * 24, // emoji size
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 720, // spin while falling
  }))
}

export function EmojiDisplay({ emojis }: EmojiDisplayProps) {
  const topEmoji = emojis[0]?.emoji || "✨"
  const revealDelay = 2.5 // when rankings start appearing

  // Memoize raindrops so they don't regenerate on re-render
  const raindrops = useMemo(() => generateRaindrops(50), [])

  return (
    <div className="relative w-full min-h-[350px]">
      {/* Emoji rainfall - fixed to cover entire screen */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {raindrops.map((drop) => (
          <motion.div
            key={drop.id}
            className="absolute"
            style={{
              left: `${drop.x}%`,
              top: -60,
            }}
            initial={{
              y: 0,
              rotate: drop.rotation,
              opacity: 0,
            }}
            animate={{
              y: [0, window.innerHeight + 100],
              rotate: drop.rotation + drop.rotationSpeed,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              delay: drop.delay,
              duration: drop.duration,
              ease: "easeIn",
              opacity: {
                delay: drop.delay,
                duration: drop.duration,
                times: [0, 0.1, 0.8, 1],
              },
            }}
          >
            <TwemojiImage emoji={topEmoji} size={drop.size} />
          </motion.div>
        ))}
      </div>

      {/* Rankings reveal */}
      <motion.div
        className="relative z-10 flex flex-col gap-4 items-center pt-6 pb-4 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: revealDelay, duration: 0.5 }}
      >
        {emojis.slice(0, 3).map((item, index) => (
          <motion.div
            key={item.emoji + index}
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: revealDelay + 0.2 + index * 0.25,
              duration: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl px-6 py-3"
          >
            {/* Rank badge */}
            <span className="text-3xl">{rankBadges[index]}</span>

            {/* Emoji with pulse */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                delay: revealDelay + 0.5 + index * 0.25,
                duration: 0.4,
                ease: "easeInOut",
              }}
            >
              <TwemojiImage emoji={item.emoji} size={56} />
            </motion.div>

            {/* Count */}
            <div className="text-left">
              <p className="text-xl font-bold text-text-primary">
                {item.count.toLocaleString()}
              </p>
              <p className="text-xs text-text-secondary">times</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Subtle glow behind content after reveal */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: revealDelay + 0.3, duration: 0.8 }}
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(255, 215, 0, 0.1) 0%,
            transparent 60%)`,
        }}
      />
    </div>
  )
}
