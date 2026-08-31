import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  createPetSchema,
  type CreatePetFormData,
} from "./CreatePet.schema";

import FormField from "../../components/common/FormField";
import { createPet } from "../../services/petService";

const SPECIES_LABEL: Record<CreatePetFormData["type"], string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  other: "Otro",
};

export default function CreatePetForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePetFormData>({
    resolver: zodResolver(createPetSchema),
  });

  const { mutate, isPending, isError } = useMutation({
    mutationFn: createPet,
    onSuccess: (pet) => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      navigate(`/pets/${pet.id}`);
    },
  });

  function onSubmit(data: CreatePetFormData) {
    mutate({
      name: data.name,
      species: SPECIES_LABEL[data.type],
      city: data.city,
      contactPhone: data.phone,
      status: data.status,
      description: data.description,
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <FormField
        label="Nombre"
        error={errors.name?.message}
      >
        <input
          {...register("name")}
          className="w-full rounded border p-2"
        />
      </FormField>

      <FormField
        label="Tipo de mascota"
        error={errors.type?.message}
      >
        <select
          {...register("type")}
          className="w-full rounded border p-2"
        >
          <option value="">Seleccioná un tipo</option>
          <option value="dog">Perro</option>
          <option value="cat">Gato</option>
          <option value="bird">Ave</option>
          <option value="other">Otro</option>
        </select>
      </FormField>

      <FormField
        label="Estado"
        error={errors.status?.message}
      >
        <select
          {...register("status")}
          className="w-full rounded border p-2"
        >
          <option value="">Seleccioná un estado</option>
          <option value="LOST">Perdido</option>
          <option value="FOUND">Encontrado</option>
        </select>
      </FormField>

      <FormField
        label="Ciudad"
        error={errors.city?.message}
      >
        <input
          {...register("city")}
          className="w-full rounded border p-2"
        />
      </FormField>

      <FormField
        label="Teléfono"
        error={errors.phone?.message}
      >
        <input
          {...register("phone")}
          className="w-full rounded border p-2"
        />
      </FormField>

      <FormField
        label="Descripción"
        error={errors.description?.message}
      >
        <textarea
          {...register("description")}
          className="w-full rounded border p-2"
        />
      </FormField>

      {isError && (
        <p className="text-sm text-red-500">
          No pudimos publicar la mascota. Intentá de nuevo.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-orange-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {isPending ? "Publicando..." : "Publicar"}
      </button>
    </form>
  );
}
