import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: "sm" | "md";
  }
>;

const baseClasses =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md",
  secondary:
    "bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100",
  ghost:
    "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow-md",
};

const sizes: Record<"sm" | "md", string> = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}