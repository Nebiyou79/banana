// components/social/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm hover:from-yellow-500 hover:to-orange-600",
        secondary:
          "border-transparent bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm hover:from-blue-600 hover:to-purple-700",
        destructive:
          "border-transparent bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-sm hover:from-red-600 hover:to-pink-700",
        outline: "text-gray-700 border-gray-300 hover:border-yellow-400 hover:text-gray-900",
        success:
          "border-transparent bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm hover:from-green-600 hover:to-emerald-700",
        warning:
          "border-transparent bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm hover:from-orange-600 hover:to-red-600",
        premium:
          "border-amber-500/30 bg-amber-500/10 text-amber-300 backdrop-blur-sm hover:bg-amber-500/20",
        "premium-outline":
          "border-amber-500/30 text-amber-300 bg-transparent hover:bg-amber-500/10",
        info:
          "border-transparent bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-sm hover:from-blue-500 hover:to-cyan-600",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }