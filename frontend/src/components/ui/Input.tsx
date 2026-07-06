import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

export default function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400",
        className
      )}
      {...props}
    />
  );
}