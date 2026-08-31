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
    return ( <Card>
    {icon}
    <h3>{value}</h3>
    <p>{label}</p>
    </Card>)
}