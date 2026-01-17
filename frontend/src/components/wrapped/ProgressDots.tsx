import { cn } from "@/lib/utils"

interface ProgressDotsProps {
  total: number
  current: number
  onDotClick?: (index: number) => void
}

export function ProgressDots({ total, current, onDotClick }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick?.(index)}
          disabled={!onDotClick}
          className={cn(
            "transition-all duration-300",
            index === current
              ? "w-8 h-2 rounded-full bg-primary"
              : "w-2 h-2 rounded-full bg-surface-elevated hover:bg-text-muted",
            onDotClick && "cursor-pointer"
          )}
        />
      ))}
    </div>
  )
}
