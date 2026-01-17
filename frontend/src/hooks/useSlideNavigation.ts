import { useState, useCallback, useEffect } from "react"

interface UseSlideNavigationProps {
  totalSlides: number
  onSlideChange?: (slide: number) => void
}

export function useSlideNavigation({
  totalSlides,
  onSlideChange,
}: UseSlideNavigationProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0)

  const goToSlide = useCallback(
    (slide: number) => {
      if (slide < 0 || slide >= totalSlides) return

      setDirection(slide > currentSlide ? 1 : -1)
      setCurrentSlide(slide)
      onSlideChange?.(slide)
    },
    [currentSlide, totalSlides, onSlideChange]
  )

  const next = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1)
    }
  }, [currentSlide, totalSlides, goToSlide])

  const prev = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1)
    }
  }, [currentSlide, goToSlide])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault()
        next()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        prev()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [next, prev])

  return {
    currentSlide,
    direction,
    totalSlides,
    goToSlide,
    next,
    prev,
    isFirst: currentSlide === 0,
    isLast: currentSlide === totalSlides - 1,
  }
}
