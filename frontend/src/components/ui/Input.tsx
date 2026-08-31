import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          "w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-brand-400",
          className
        )}
        {...props}
      />
    );
  }
);

export default Input;
