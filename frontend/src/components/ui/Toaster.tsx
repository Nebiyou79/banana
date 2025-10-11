// src/components/ui/Toaster.tsx
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Toast, 
  ToastClose, 
  ToastDescription, 
  ToastProvider, 
  ToastTitle, 
  ToastViewport,
  ToastIcon 
} from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            {/* Icon Container */}
            <div className="flex-shrink-0">
              <ToastIcon variant={variant} />
            </div>
            
            {/* Content Container */}
            <div className="flex-1 grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            
            {/* Action and Close */}
            <div className="flex items-start gap-2">
              {action}
              <ToastClose />
            </div>

            {/* Colored Border Effect */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 h-1 transition-all duration-300",
              variant === "success" && "bg-gradient-to-r from-emerald-400 to-emerald-600",
              variant === "destructive" && "bg-gradient-to-r from-red-400 to-red-600",
              variant === "warning" && "bg-gradient-to-r from-amber-400 to-amber-600", 
              variant === "info" && "bg-gradient-to-r from-blue-400 to-blue-600",
              (!variant || variant === "default") && "bg-gradient-to-r from-gray-400 to-gray-600"
            )} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

export default Toaster;