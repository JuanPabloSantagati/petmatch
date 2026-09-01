import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getPetById, deletePet } from "../../services/petService";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui";

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: pet,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["pet", id],
    queryFn: () => getPetById(id!),
    enabled: Boolean(id),
  });

  const { mutate: removePet, isPending: isDeleting } = useMutation({
    mutationFn: () => deletePet(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      navigate("/");
    },
    onError: () => {
      setDeleteError("No pudimos eliminar la publicación. Intentá de nuevo.");
    },
  });

  function handleDelete() {
    setDeleteError(null);

    if (confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) {
      removePet();
    }
  }

  if (isLoading) {
    return <p className="py-20 text-center text-gray-500">Cargando...</p>;
  }

  if (isError || !pet) {
    return (
      <div className="py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold">Mascota no encontrada</h1>
        <Link to="/" className="text-brand-500 hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === pet.ownerId;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="mb-6 inline-block text-brand-500 hover:underline">
        ← Volver
      </Link>

      <div className="rounded-2xl border bg-white p-8 shadow">
        <img
          src={pet.image}
          alt={pet.name}
          className="mb-6 h-64 w-full rounded-lg object-cover"
        />

        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-4xl font-bold">{pet.name}</h1>

          {isOwner && (
            <div className="flex gap-2">
              <Link to={`/pets/${pet.id}/editar`}>
                <Button variant="secondary">Editar</Button>
              </Link>
              <Button
                variant="secondary"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          )}
        </div>

        {deleteError && (
          <p className="mb-4 text-sm text-red-500">{deleteError}</p>
        )}

        <p className="mb-6 text-gray-500">{pet.breed}</p>

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
            <strong>Estado:</strong> {pet.status === "LOST" ? "Perdido" : "Encontrado"}
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
