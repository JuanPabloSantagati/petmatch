import { PawPrint, Users, MapPin } from "lucide-react";
import StatCard from "./StatCard";

const stats = [
  {
    id: 1,
    icon: <PawPrint />,
    value: "250",
    label: "Mascotas reunidas",
  },
  {
    id: 2,
    icon: <Users />,
    value: "1200",
    label: "Usuarios registrados",
  },
  {
    id: 3,
    icon: <MapPin />,
    value: "80",
    label: "Publicaciones activas",
  },
];

export default function Stats() {
  return (
    <section className="grid gap-6 md:grid-cols-3">
      {stats.map((stat) => (
        <StatCard
          key={stat.id}
          icon={stat.icon}
          value={stat.value}
          label={stat.label}
        />
      ))}
    </section>
  );
}