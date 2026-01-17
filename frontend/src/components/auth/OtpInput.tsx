import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled,
  className,
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Sync external value with internal state
    const chars = value.split("").slice(0, length)
    const newOtp = [...chars, ...new Array(length - chars.length).fill("")]
    setOtp(newOtp)
  }, [value, length])

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!/^\d*$/.test(val)) return

    const newOtp = [...otp]
    newOtp[index] = val.slice(-1)
    setOtp(newOtp)
    onChange(newOtp.join(""))

    // Move to next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
    const newOtp = [...pastedData.split(""), ...new Array(length - pastedData.length).fill("")]
    setOtp(newOtp)
    onChange(newOtp.join(""))
    inputRefs.current[Math.min(pastedData.length, length - 1)]?.focus()
  }

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 text-center text-xl font-semibold rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-all"
        />
      ))}
    </div>
  )
}
