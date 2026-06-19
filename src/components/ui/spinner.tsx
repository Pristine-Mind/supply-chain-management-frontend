import { cn } from "../../lib/utils"

interface SpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  color?: "primary" | "neutral" | "white"
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
}

const colorClasses = {
  primary: "border-primary-600 border-t-transparent",
  neutral: "border-neutral-400 border-t-transparent",
  white: "border-white border-t-transparent",
}

export function Spinner({ className, size = "md", color = "primary" }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}
