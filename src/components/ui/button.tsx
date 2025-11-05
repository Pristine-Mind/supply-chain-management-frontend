import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-body font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-primary",
        destructive:
          "bg-accent-error-500 text-white shadow-soft hover:bg-accent-error-600 focus-visible:ring-accent-error-200",
        outline: "btn-secondary",
        secondary:
          "bg-secondary-100 text-secondary-700 shadow-soft hover:bg-secondary-200 focus-visible:ring-secondary-200",
        ghost: "btn-ghost",
        link: "text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-200",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-body-sm",
        lg: "px-8 py-4 text-body-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
