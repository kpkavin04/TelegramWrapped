import { motion } from "framer-motion"

interface TimeOfDayChartProps {
  hourData: Record<number, number>
}

export function TimeOfDayChart({ hourData }: TimeOfDayChartProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const maxCount = Math.max(...Object.values(hourData), 1)

  const peakHour = Object.entries(hourData).reduce(
    (max, [hour, count]) =>
      count > max.count ? { hour: parseInt(hour), count } : max,
    { hour: 0, count: 0 }
  )

  const formatHour = (hour: number) => {
    if (hour === 0) return "12am"
    if (hour === 12) return "12pm"
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8"
    >
      {/* Clock visualization */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="relative w-64 h-64"
      >
        <div className="absolute inset-0 rounded-full border-2 border-border" />

        {hours.map((hour) => {
          const angle = (hour * 15 - 90) * (Math.PI / 180)
          const intensity = (hourData[hour] || 0) / maxCount
          const radius = 100
          const x = Math.cos(angle) * radius + 128
          const y = Math.sin(angle) * radius + 128

          return (
            <motion.div
              key={hour}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: hour * 0.05 }}
              className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: x,
                top: y,
                backgroundColor: `rgba(0, 136, 204, ${0.2 + intensity * 0.8})`,
                transform: `translate(-50%, -50%) scale(${0.5 + intensity * 1.5})`,
              }}
            />
          )
        })}

        {/* Peak hour indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute inset-0 flex items-center justify-center flex-col"
        >
          <span className="text-4xl font-bold text-primary">
            {formatHour(peakHour.hour)}
          </span>
          <span className="text-sm text-text-secondary">peak time</span>
        </motion.div>
      </motion.div>

      {/* Bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-end gap-1 h-24"
      >
        {hours.map((hour) => {
          const count = hourData[hour] || 0
          const height = (count / maxCount) * 100

          return (
            <motion.div
              key={hour}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 4)}%` }}
              transition={{ delay: 0.5 + hour * 0.03, duration: 0.3 }}
              className="w-2 bg-primary/60 rounded-t hover:bg-primary transition-colors"
              title={`${formatHour(hour)}: ${count} messages`}
            />
          )
        })}
      </motion.div>

      <p className="text-text-secondary text-sm">
        You're most active at{" "}
        <span className="text-primary font-medium">
          {formatHour(peakHour.hour)}
        </span>
      </p>
    </motion.div>
  )
}
