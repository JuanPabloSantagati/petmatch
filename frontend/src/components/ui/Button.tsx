import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "inverse" | "light";
};

export default function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-lg px-6 py-3 font-medium shadow-sm transition",
        {
          "bg-brand-500 text-white hover:bg-brand-600":
            variant === "primary",

          "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50":
            variant === "secondary",

          "border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20":
            variant === "inverse",

          "bg-white text-brand-600 hover:bg-brand-50":
            variant === "light",
        },
        className
      )}
      {...props}
    />
  );
}