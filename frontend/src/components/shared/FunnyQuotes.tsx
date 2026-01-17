import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const quotes = [
  "Analyzing your questionable emoji choices...",
  "Counting how many times you said 'lol' but didn't actually laugh...",
  "Calculating your peak overthinking hours...",
  "Measuring your dedication to leaving people on read...",
  "Evaluating your late-night texting decisions...",
  "Discovering your most unhinged conversations...",
  "Crunching the numbers on your reply speed...",
  "Finding out who you trauma-dumped on the most...",
  "Rating your meme-sending frequency...",
  "Determining if you're the group chat villain...",
  "Investigating your 3am texting habits...",
  "Assessing your 'typing...' abandonment rate...",
  "Cataloging your virtual hugs and heart emojis...",
  "Revealing your dramatic ellipsis usage...",
  "Uncovering your real personality (scary)...",
]

interface FunnyQuotesProps {
  interval?: number
}

export function FunnyQuotes({ interval = 3000 }: FunnyQuotesProps) {
  const [currentQuote, setCurrentQuote] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length)
    }, interval)
    return () => clearInterval(timer)
  }, [interval])

  return (
    <div className="h-6 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentQuote}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-text-secondary text-sm text-center"
        >
          {quotes[currentQuote]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
