import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getPetById } from "../../services/petService";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

export default function PetDetail() {
  const { id } = useParams();

  const {
    data: pet,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["pet", id],
    queryFn: () => getPetById(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <p className="py-20 text-center text-gray-500">
        Cargando...
      </p>
    );
  }

  if (isError || !pet) {
    return (
      <div className="py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold">
          Mascota no encontrada
        </h1>

        <Link
          to="/"
          className="text-orange-500 hover:underline"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/"
        className="mb-6 inline-block text-orange-500 hover:underline"
      >
        ← Volver
      </Link>

      <div className="rounded-2xl border bg-white p-8 shadow">
        <img
          src={pet.image}
          alt={pet.name}
          className="mb-6 h-64 w-full rounded-lg object-cover"
        />

        <h1 className="mb-2 text-4xl font-bold">
          {pet.name}
        </h1>

        <p className="mb-6 text-gray-500">
          {pet.breed}
        </p>

        <div className="space-y-3">
          <p>
            <strong>Especie:</strong> {pet.species}
          </p>

          <p>
            <strong>Ciudad:</strong> {pet.city}
          </p>

          <p>
            <strong>Descripción:</strong> {pet.description}
          </p>

          <p>
            <strong>Estado:</strong>{" "}
            {pet.status === "LOST" ? "Perdido" : "Encontrado"}
          </p>

          <p>
            <strong>Contacto:</strong> {pet.contactPhone}
          </p>

          <p className="text-sm text-gray-400">
            Publicado {formatRelativeTime(pet.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
