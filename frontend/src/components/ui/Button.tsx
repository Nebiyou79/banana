import React from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild: true
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = "primary", 
  size = "md",
  className = "", 
  ...props 
}) => {
  let variantClasses = "";
  let sizeClasses = "";

  // Variant styles
  switch (variant) {
    case "primary":
      variantClasses = "bg-blue-600 hover:bg-blue-700 text-white";
      break;
    case "secondary":
      variantClasses = "bg-gray-600 hover:bg-gray-700 text-white";
      break;
    case "outline":
      variantClasses = "border border-gray-400 text-gray-700 hover:bg-gray-100";
      break;
    case "ghost":
      variantClasses = "border border-gray-700 text-gray-700 hover:bg-gray-300";
      break;
    default:
      variantClasses = "bg-blue-600 hover:bg-blue-700 text-white";
  }

  // Size styles
  switch (size) {
    case "sm":
      sizeClasses = "px-2 py-1 text-sm";
      break;
    case "md":
      sizeClasses = "px-4 py-2 text-base";
      break;
    case "lg":
      sizeClasses = "px-6 py-3 text-lg";
      break;
    default:
      sizeClasses = "px-4 py-2 text-base";
  }

  return (
    <button
      {...props}
      className={`${variantClasses} ${sizeClasses} rounded-lg disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
};
