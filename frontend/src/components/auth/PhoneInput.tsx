import { useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

const countryCodes = [
  { code: "+1", country: "US" },
  { code: "+44", country: "UK" },
  { code: "+91", country: "IN" },
  { code: "+86", country: "CN" },
  { code: "+81", country: "JP" },
  { code: "+49", country: "DE" },
  { code: "+33", country: "FR" },
  { code: "+39", country: "IT" },
  { code: "+55", country: "BR" },
  { code: "+7", country: "RU" },
  { code: "+82", country: "KR" },
  { code: "+61", country: "AU" },
  { code: "+34", country: "ES" },
  { code: "+52", country: "MX" },
  { code: "+31", country: "NL" },
  { code: "+65", country: "SG" },
]

export function PhoneInput({ onChange, className, disabled }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState("+1")
  const [localPhone, setLocalPhone] = useState("")

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/\D/g, "")
    setLocalPhone(phone)
    onChange(countryCode + phone)
  }

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value
    setCountryCode(newCode)
    onChange(newCode + localPhone)
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <select
        value={countryCode}
        onChange={handleCountryChange}
        disabled={disabled}
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
      >
        {countryCodes.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} {c.country}
          </option>
        ))}
      </select>
      <Input
        type="tel"
        placeholder="Phone number"
        value={localPhone}
        onChange={handlePhoneChange}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  )
}
