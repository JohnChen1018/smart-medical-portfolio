import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gradient";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600/20 disabled:border-gray-600/30 disabled:text-gray-500 disabled:hover:bg-gray-600/20 disabled:hover:border-gray-600/30";

    const variants = {
      primary:
        "border border-[var(--color-primary)]/40 text-[#E6EDF3] hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-primary)]/15 shadow-[0_0_20px_rgba(74,222,128,0.1)] hover:shadow-[0_0_25px_rgba(74,222,128,0.2)]",
      secondary:
        "bg-[#111827] hover:bg-[#1F2937] text-[#E6EDF3] border border-[#1F2937] hover:border-[#374151]",
      outline:
        "bg-transparent border border-[#1F2937] hover:bg-[#111827] hover:border-[var(--color-primary)]/50 text-[#9CA3AF] hover:text-[#E6EDF3]",
      ghost: "bg-transparent hover:bg-[#111827] text-[#9CA3AF] hover:text-[#E6EDF3]",
      gradient: "bg-gradient-to-br from-[#4ADE80]/20 to-[#4ADE80]/5 border border-[#4ADE80]/30 hover:from-[#4ADE80]/30 hover:to-[#4ADE80]/10 text-[#4ADE80]",
    };

    const sizes = {
      sm: "text-xs py-1.5 px-3",
      md: "text-sm py-2.5 px-5",
      lg: "text-base py-2.5 px-5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            請稍候
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
