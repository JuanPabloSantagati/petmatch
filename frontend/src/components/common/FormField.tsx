import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}




export default function FormField({
  label,
  error,
  children,
}: FormFieldProps) {
    return (
        <div className="mb-4">
            <label className="block mb-1 font-medium">{label}</label>
            {children}
            {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
        </div>
    );

}