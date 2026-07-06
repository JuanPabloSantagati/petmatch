import { Search } from "lucide-react";
import { Button, Card, Input } from "../../components/ui";
import PetCard from "../../components/common/PetCard";
import { mockPets } from "../../mocks/mockPets";

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-orange-500 px-8 py-20 text-center text-white">
        <h1 className="mb-6 text-5xl font-bold">
          Encontrá a tu mejor amigo
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg">
          Publicá mascotas perdidas o encontradas y ayudá a reunir familias.
        </p>

        <div className="mx-auto flex max-w-xl gap-3">
          <Input
            placeholder="Buscar por ciudad, nombre o raza..."
          />

          <Button>
            <Search size={20} />
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-3xl font-bold">
          Publicaciones recientes
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockPets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}