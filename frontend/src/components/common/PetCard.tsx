import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

import type { Pet } from "../../types/pet";
import { Badge, Card, Button } from "../ui";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { useAuth } from "../../context/AuthContext";
import { deletePet } from "../../services/petService";

interface Props {
  pet: Pet;
}

export default function PetCard({ pet }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { mutate: removePet, isPending: isDeleting } = useMutation({
    mutationFn: () => deletePet(pet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
    onError: () => {
      setDeleteError("No pudimos eliminar la publicación. Intentá de nuevo.");
    },
  });

  const isOwner = user?.id === pet.ownerId;

  function handleEdit(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    navigate(`/pets/${pet.id}/editar`);
  }

  function handleDelete(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDeleteError(null);

    if (confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) {
      removePet();
    }
  }

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
        {formatRelativeTime(pet.createdAt)}
      </p>

      {deleteError && (
        <p className="mt-2 text-sm text-red-500">{deleteError}</p>
      )}

      {isOwner ? (
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={handleEdit}>
            Editar
          </Button>
          <Button
            variant="secondary"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      ) : (
        <Button className="mt-5 w-full">Ver detalle</Button>
      )}
    </Card>
  );
}
