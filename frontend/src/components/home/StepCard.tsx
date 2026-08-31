import type { ReactNode } from "react";
import Card from "../ui/Card";

interface StepCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function StepCard({
  icon,
  title,
  description,
}: StepCardProps) {
  return (
    <Card>
      <div className="mb-4 text-orange-500">
        {icon}
      </div>

      <h3 className="mb-2 text-xl font-semibold">
        {title}
      </h3>

      <p className="text-gray-600">
        {description}
      </p>
    </Card>
  );
}