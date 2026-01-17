import { motion } from "framer-motion"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface SentimentData {
  [month: string]: {
    primary: string
    secondary: string
    confidence: number
    vibe_summary: string
  }
}

interface SentimentChartProps {
  data: SentimentData
}

const vibeToScore: Record<string, number> = {
  "chaotic energy": 90,
  "wholesome": 85,
  "unhinged": 80,
  "dramatic": 75,
  "chill": 70,
  "existential": 50,
  "passive aggressive": 40,
  "depressed": 30,
  "angry": 20,
}

export function SentimentChart({ data }: SentimentChartProps) {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]

  const chartData = months.map((month, index) => {
    const monthKey = String(index + 1).padStart(2, "0")
    const monthData = data[monthKey] || data[month.toLowerCase()]

    return {
      month,
      score: monthData
        ? vibeToScore[monthData.primary.toLowerCase()] || monthData.confidence * 100
        : null,
      vibe: monthData?.primary || null,
    }
  }).filter((d) => d.score !== null)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-2xl"
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="month"
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            hide
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1c1c21",
              border: "1px solid #2a2a30",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(_value, _name, props) => [
              (props as { payload?: { vibe?: string } }).payload?.vibe || "",
              "Vibe",
            ]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#0088cc"
            strokeWidth={3}
            dot={{
              fill: "#0088cc",
              strokeWidth: 2,
              r: 6,
            }}
            activeDot={{
              fill: "#0099e6",
              strokeWidth: 2,
              r: 8,
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex flex-wrap justify-center gap-2"
      >
        {chartData.slice(0, 5).map((d, i) => (
          <span
            key={i}
            className="px-3 py-1 text-sm bg-surface-elevated rounded-full text-text-secondary"
          >
            {d.month}: {d.vibe}
          </span>
        ))}
      </motion.div>
    </motion.div>
  )
}
