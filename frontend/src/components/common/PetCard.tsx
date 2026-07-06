import { MapPin } from "lucide-react";
import type { Pet } from "../../types/pet";
import { Badge, Card, Button } from "../ui";

interface Props {
  pet: Pet;
}

export default function PetCard({ pet }: Props) {
  return (
    <Card>
      <img
        src={pet.image}
        alt={pet.name}
        className="mb-4 h-52 w-full rounded-lg object-cover"
      />

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">{pet.name}</h3>

        <Badge
          text={pet.status === "LOST" ? "Perdido" : "Encontrado"}
        />
      </div>

      <p className="mt-2 text-gray-600">
        {pet.species} • {pet.breed}
      </p>

      <div className="mt-2 flex items-center gap-2 text-gray-500">
        <MapPin size={18} />
        {pet.city}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        {pet.publishedAt}
      </p>

      <Button className="mt-5 w-full">
        Ver detalle
      </Button>
    </Card>
  );
}