import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: {
    label: string
    to: string
  }
  className?: string
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between mb-6", className)}>
      <div>
        <h2 className="text-h2-mobile md:text-h2 text-neutral-900">{title}</h2>
        {subtitle && <p className="mt-1 text-body-sm text-neutral-500">{subtitle}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="hidden sm:inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          {action.label}
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      )}
    </div>
  )
}
