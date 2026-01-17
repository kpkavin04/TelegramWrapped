import type { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SlideContainerProps {
  children: ReactNode
  slideKey: number | string
  direction?: number
}

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    scale: direction > 0 ? 0.95 : 1.05,
    x: direction > 0 ? 100 : -100,
  }),
  center: {
    opacity: 1,
    scale: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    scale: direction > 0 ? 1.05 : 0.95,
    x: direction > 0 ? -100 : 100,
  }),
}

export function SlideContainer({ children, slideKey, direction = 1 }: SlideContainerProps) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={slideKey}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="absolute inset-0 flex flex-col items-center justify-center p-8"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
