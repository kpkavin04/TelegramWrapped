import { useEffect, useState } from "react"
import { motion, useSpring, useTransform } from "framer-motion"

interface NumberCounterProps {
  value: number
  duration?: number
  className?: string
  suffix?: string
  prefix?: string
}

export function NumberCounter({
  value,
  duration = 2,
  className,
  suffix = "",
  prefix = "",
}: NumberCounterProps) {
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000,
  })

  const display = useTransform(spring, (latest) =>
    Math.round(latest).toLocaleString()
  )

  const [displayValue, setDisplayValue] = useState("0")

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useEffect(() => {
    return display.on("change", (v) => setDisplayValue(v))
  }, [display])

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}
      {displayValue}
      {suffix}
    </motion.span>
  )
}
