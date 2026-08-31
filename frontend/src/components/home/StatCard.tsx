import type { ReactNode } from "react";
import Card from "../ui/Card";

interface StatCardProps {
  icon: ReactNode;
  value: string;
  label: string;
}

export default function StatCard({
  icon,
  value,
  label,
}: StatCardProps) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          {icon}
        </div>

        <h3 className="text-3xl font-bold text-gray-800">{value}</h3>

        <p className="text-gray-500">{label}</p>
      </div>
    </Card>
  );
}
