// components/social/ui/input.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "search" | "filled"
  label?: string
  helperText?: string
  error?: boolean
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", label, helperText, error, ...props }, ref) => {
    const variantStyles = {
      default: "border-2 border-gray-300 bg-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200",
      search: "border-2 border-gray-300 bg-gray-50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 pl-10",
      filled: "border-2 border-transparent bg-gray-100 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 focus:bg-white"
    }

    const inputElement = (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl px-4 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
          variantStyles[variant],
          error && "border-red-500 focus:border-red-500 focus:ring-red-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (label || helperText) {
      return (
        <div className="space-y-2">
          {label && (
            <label className="block text-sm font-semibold text-gray-900">
              {label}
            </label>
          )}
          {inputElement}
          {helperText && (
            <p className={cn(
              "text-xs",
              error ? "text-red-600" : "text-gray-600"
            )}>
              {helperText}
            </p>
          )}
        </div>
      )
    }

    return inputElement
  }
)
Input.displayName = "Input"

export { Input }