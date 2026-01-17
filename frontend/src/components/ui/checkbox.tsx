import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            "h-5 w-5 shrink-0 rounded border border-border bg-surface ring-offset-background peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center",
            className
          )}
        >
          <Check className="h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

// Simple controlled checkbox component
interface SimpleCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

export const SimpleCheckbox: React.FC<SimpleCheckboxProps> = ({
  checked,
  onChange,
  className,
  disabled,
}) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "h-5 w-5 shrink-0 rounded border border-border bg-surface ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-colors",
        checked && "bg-primary border-primary",
        className
      )}
    >
      {checked && <Check className="h-4 w-4 text-white" />}
    </button>
  )
}

export { Checkbox }
