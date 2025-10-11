import React from "react";

type SleekVariant = "primary" | "secondary" | "outline" | "gradient" | "danger";
type SleekSize = "sm" | "md" | "lg" | "xl";

interface SleekButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SleekVariant;
  size?: SleekSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode; // Optional icon
  iconPosition?: "left" | "right";
}

export const SleekButton: React.FC<SleekButtonProps> = ({ 
  children, 
  variant = "primary", 
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = "left",
  className = "", 
  disabled,
  ...props 
}) => {
  // Base classes for all sleek buttons
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-3 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none";
  
  // Width class
  const widthClass = fullWidth ? "w-full" : "";

  // Variant styles
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0";
      
      case "secondary":
        return "bg-gray-800 hover:bg-gray-900 text-white focus:ring-gray-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0";
      
      case "outline":
        return "border-2 border-blue-500 bg-transparent text-blue-600 hover:bg-blue-500 hover:text-white focus:ring-blue-500 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0";
      
      case "gradient":
        return "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white focus:ring-purple-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0";
      
      case "danger":
        return "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white focus:ring-red-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0";
      
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0";
    }
  };

  // Size styles
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-6 py-3 text-sm";
      case "md":
        return "px-8 py-4 text-base";
      case "lg":
        return "px-10 py-5 text-lg";
      case "xl":
        return "px-12 py-6 text-xl";
      default:
        return "px-8 py-4 text-base";
    }
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <span>Loading...</span>
    </div>
  );

  // Icon with proper spacing
  const IconContent = () => {
    if (!icon) return null;
    
    return (
      <span className={iconPosition === "left" ? "mr-3" : "ml-3"}>
        {icon}
      </span>
    );
  };

  const variantClasses = getVariantClasses();
  const sizeClasses = getSizeClasses();

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${className} ${
        loading ? "cursor-wait" : ""
      }`}
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {icon && iconPosition === "left" && <IconContent />}
          {children}
          {icon && iconPosition === "right" && <IconContent />}
        </>
      )}
    </button>
  );
};

// Convenience exports for common use cases
export const AuthButton: React.FC<Omit<SleekButtonProps, 'variant'>> = (props) => {
  return <SleekButton {...props} variant="gradient" fullWidth size="lg" />;
};

export const LoginButton: React.FC<Omit<SleekButtonProps, 'variant'>> = (props) => {
  return <SleekButton {...props} variant="primary" fullWidth size="lg" />;
};

export const SignUpButton: React.FC<Omit<SleekButtonProps, 'variant'>> = (props) => {
  return <SleekButton {...props} variant="outline" fullWidth size="lg" />;
};

export const CTAButton: React.FC<Omit<SleekButtonProps, 'variant'>> = (props) => {
  return <SleekButton {...props} variant="gradient" size="xl" />;
};