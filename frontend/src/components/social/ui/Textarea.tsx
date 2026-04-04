// components/social/ui/textarea.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "filled"
  label?: string
  helperText?: string
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "default", label, helperText, error, ...props }, ref) => {
    const variantStyles = {
      default: "border-2 border-gray-300 bg-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200",
      filled: "border-2 border-transparent bg-gray-100 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 focus:bg-white"
    }

    const textareaElement = (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 resize-none",
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
          {textareaElement}
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

    return textareaElement
  }
)
Textarea.displayName = "Textarea"

export { Textarea }