import { motion } from "framer-motion"
import { useState, useRef, useEffect, useCallback } from "react"

interface WordCloudProps {
  wordFrequency: Record<string, number>
  maxWords?: number
}

interface Bubble {
  word: string
  count: number
  radius: number
  x: number
  y: number
}

export function WordCloud({ wordFrequency, maxWords = 30 }: WordCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [containerSize, setContainerSize] = useState({ width: 400, height: 400 })

  // Sort words by frequency and take top N
  const sortedWords = Object.entries(wordFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxWords)

  const maxCount = sortedWords[0]?.[1] || 1
  const minCount = sortedWords[sortedWords.length - 1]?.[1] || 1

  // Calculate bubble radius based on frequency (min 25px, max 60px)
  const getRadius = useCallback((count: number) => {
    if (maxCount === minCount) return 40
    const ratio = (count - minCount) / (maxCount - minCount)
    return 25 + ratio * 35
  }, [maxCount, minCount])

  // Circle packing algorithm
  const packCircles = useCallback((width: number, height: number) => {
    const centerX = width / 2
    const centerY = height / 2
    const padding = 4

    const circles: Bubble[] = sortedWords.map(([word, count]) => ({
      word,
      count,
      radius: getRadius(count),
      x: centerX,
      y: centerY,
    }))

    // Sort by radius descending - place larger circles first
    circles.sort((a, b) => b.radius - a.radius)

    // Place first circle at center
    if (circles.length > 0) {
      circles[0].x = centerX
      circles[0].y = centerY
    }

    // Place remaining circles
    for (let i = 1; i < circles.length; i++) {
      const circle = circles[i]
      let bestPos = { x: centerX, y: centerY }
      let bestDist = Infinity

      // Try positions around existing circles
      for (let j = 0; j < i; j++) {
        const other = circles[j]
        const targetDist = other.radius + circle.radius + padding

        // Try multiple angles around this circle
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
          const testX = other.x + Math.cos(angle) * targetDist
          const testY = other.y + Math.sin(angle) * targetDist

          // Check if this position overlaps with any placed circle
          let overlaps = false
          for (let k = 0; k < i; k++) {
            const placed = circles[k]
            const dist = Math.hypot(testX - placed.x, testY - placed.y)
            if (dist < placed.radius + circle.radius + padding - 1) {
              overlaps = true
              break
            }
          }

          if (!overlaps) {
            // Prefer positions closer to center
            const distToCenter = Math.hypot(testX - centerX, testY - centerY)
            if (distToCenter < bestDist) {
              bestDist = distToCenter
              bestPos = { x: testX, y: testY }
            }
          }
        }
      }

      circle.x = bestPos.x
      circle.y = bestPos.y
    }

    // Recenter the whole cluster
    if (circles.length > 0) {
      const avgX = circles.reduce((sum, c) => sum + c.x, 0) / circles.length
      const avgY = circles.reduce((sum, c) => sum + c.y, 0) / circles.length
      const offsetX = centerX - avgX
      const offsetY = centerY - avgY

      circles.forEach(c => {
        c.x += offsetX
        c.y += offsetY
      })
    }

    return circles
  }, [sortedWords, getRadius])

  useEffect(() => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const width = rect.width || 400
    const height = rect.height || 400
    setContainerSize({ width, height })

    const packed = packCircles(width, height)
    setBubbles(packed)
  }, [wordFrequency, packCircles])

  // Color palette for bubbles
  const colors = [
    "rgba(0, 136, 204, 0.9)",
    "rgba(0, 198, 255, 0.9)",
    "rgba(99, 102, 241, 0.9)",
    "rgba(168, 85, 247, 0.9)",
    "rgba(236, 72, 153, 0.9)",
    "rgba(34, 197, 94, 0.9)",
    "rgba(234, 179, 8, 0.9)",
  ]

  // Get color by original frequency rank
  const getColorIndex = (word: string) => {
    const idx = sortedWords.findIndex(([w]) => w === word)
    return idx >= 0 ? idx % colors.length : 0
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-[50vh] min-h-[300px] rounded-xl overflow-hidden bg-background"
      style={{ touchAction: "none" }}
    >
      {bubbles.map((bubble, i) => {
        const color = colors[getColorIndex(bubble.word)]
        const size = bubble.radius * 2

        return (
          <motion.div
            key={bubble.word}
            drag
            dragMomentum={false}
            dragConstraints={containerRef}
            initial={{ opacity: 0, scale: 0, x: containerSize.width / 2, y: containerSize.height / 2 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: bubble.x - bubble.radius,
              y: bubble.y - bubble.radius,
            }}
            transition={{
              opacity: { delay: i * 0.02, duration: 0.3 },
              scale: { delay: i * 0.02, duration: 0.4, type: "spring", stiffness: 200 },
              x: { delay: i * 0.02, duration: 0.5, type: "spring", stiffness: 100 },
              y: { delay: i * 0.02, duration: 0.5, type: "spring", stiffness: 100 },
            }}
            whileHover={{ scale: 1.1, zIndex: 100 }}
            whileDrag={{ scale: 1.1, zIndex: 100 }}
            className="absolute cursor-grab active:cursor-grabbing flex items-center justify-center rounded-full shadow-lg"
            style={{
              width: size,
              height: size,
              background: color,
              boxShadow: `0 4px 15px ${color.replace("0.9", "0.4")}`,
            }}
          >
            <span
              className="text-white font-semibold text-center px-1 select-none"
              style={{
                fontSize: Math.max(9, bubble.radius / 2.5),
                lineHeight: 1.1,
                wordBreak: "break-word",
              }}
            >
              {bubble.word}
            </span>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
