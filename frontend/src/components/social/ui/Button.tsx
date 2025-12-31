// components/social/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "./LoadingSpinner"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        // Default variants
        default: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg hover:shadow-xl hover:from-yellow-500 hover:to-orange-600",
        destructive: "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg hover:shadow-xl hover:from-red-600 hover:to-pink-700",
        outline: "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-yellow-400 hover:text-gray-900",
        secondary: "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        link: "text-gray-900 underline-offset-4 hover:underline",
        
        // Premium dark theme variants
        premium: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-yellow-700 border border-amber-400/30",
        "premium-outline": "border-2 border-amber-500/30 bg-transparent text-amber-300 hover:bg-amber-500/10 hover:border-amber-400/50 hover:text-amber-200 backdrop-blur-sm",
        "premium-ghost": "text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 backdrop-blur-sm",
        "premium-destructive": "bg-gradient-to-r from-red-600 to-pink-700 text-white shadow-lg hover:shadow-xl hover:from-red-700 hover:to-pink-800 border border-red-400/30",
        
        // Social media specific variants
        "social-primary": "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700",
        "social-secondary": "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700",
        "social-ghost": "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200",
        
        // Premium social variants
        "premium-social": "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-yellow-700 border border-amber-400/30 backdrop-blur-sm",
        "premium-social-ghost": "border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400/50 hover:text-amber-200 backdrop-blur-sm",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-11 px-8 text-base",
        xl: "h-12 px-10 text-lg",
        
        // Icon sizes
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
        
        // Social media action button sizes
        "social-sm": "h-8 px-3 text-xs",          // For compact social buttons
        "social-default": "h-10 px-4 text-sm",    // Standard social buttons
        "social-lg": "h-12 px-6 text-base",       // Large prominent social buttons
        
        // Social icon sizes
        "social-icon": "h-9 w-9",                 // Standard social icon buttons
        "social-icon-sm": "h-7 w-7 text-xs",      // Small social icon buttons
        "social-icon-lg": "h-11 w-11 text-base",  // Large social icon buttons
        
        // Full width social buttons (for mobile)
        "social-full": "h-12 px-4 text-base w-full",
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
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }