import { Link } from "react-router-dom";
import PetCard from "../common/PetCard";
import type { Pet } from "../../types/pet";

interface Props {
  pets: Pet[];
}

export default function PetList({ pets }: Props) {
  return (
    <section id="publicaciones" className="scroll-mt-24">
      <h2 className="mb-6 text-3xl font-bold text-gray-800">
        Publicaciones recientes
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <Link
            key={pet.id}
            to={`/pets/${pet.id}`}
            className="block transition hover:-translate-y-1"
          >
            <PetCard pet={pet} />
          </Link>
        ))}
      </div>
    </section>
  );
}