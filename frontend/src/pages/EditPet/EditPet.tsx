import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getPetById } from "../../services/petService";
import { useAuth } from "../../context/AuthContext";
import EditPetForm from "./EditPetForm";

export default function EditPet() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data: pet, isLoading } = useQuery({
    queryKey: ["pet", id],
    queryFn: () => getPetById(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <p className="py-20 text-center text-gray-500">Cargando...</p>;
  }

  if (!pet) {
    return <Navigate to="/" replace />;
  }

  if (user?.id !== pet.ownerId) {
    return <Navigate to={`/pets/${pet.id}`} replace />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-4xl font-bold">Editar publicación</h1>
      <EditPetForm pet={pet} />
    </div>
  );
}
