import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export default function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-lg px-6 py-3 font-medium transition",
        {
          "bg-orange-500 text-white hover:bg-orange-600":
            variant === "primary",

          "border bg-white hover:bg-gray-100":
            variant === "secondary",
        },
        className
      )}
      {...props}
    />
  );
}