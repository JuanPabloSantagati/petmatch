import { PawPrint, Search, HeartHandshake } from "lucide-react";
import StepCard from "./StepCard";

const steps = [
  {
    id: 1,
    icon: <PawPrint size={40} />,
    title: "Publicá una mascota",
    description: "Completá el formulario con la información disponible.",
  },
  {
    id: 2,
    icon: <Search size={40} />,
    title: "La comunidad ayuda",
    description: "Otros usuarios podrán verla y compartirla.",
  },
  {
    id: 3,
    icon: <HeartHandshake size={40} />,
    title: "Reencuentro",
    description: "Cuando aparezca el dueño, marcá la publicación como resuelta.",
  },
];

export default function HowItWorks() {
  return (
    <section className="space-y-8">
      <h2 className="text-3xl font-bold text-center">
        ¿Cómo funciona?
      </h2>

      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((step) => (
          <StepCard
            key={step.id}
            icon={step.icon}
            title={step.title}
            description={step.description}
          />
        ))}
      </div>
    </section>
  );
}