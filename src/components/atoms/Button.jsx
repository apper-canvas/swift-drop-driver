import React from "react";
import { cn } from "@/utils/cn";

const Button = React.forwardRef(({ className, variant = "default", size = "default", children, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-soft hover:from-primary-600 hover:to-primary-700 hover:shadow-medium hover:scale-[1.02] active:scale-[0.98]",
    outline: "border border-gray-300 bg-white text-gray-700 shadow-soft hover:bg-gray-50 hover:shadow-medium hover:scale-[1.02] active:scale-[0.98]",
    ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
    destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-soft hover:from-red-600 hover:to-red-700 hover:shadow-medium hover:scale-[1.02] active:scale-[0.98]",
  };
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-6 text-lg",
    icon: "h-10 w-10",
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;