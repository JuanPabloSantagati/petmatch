import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { editPetSchema, type EditPetFormData } from "./EditPet.schema";
import FormField from "../../components/common/FormField";
import { Button, Input } from "../../components/ui";
import { updatePet } from "../../services/petService";
import type { Pet } from "../../types/pet";

interface Props {
  pet: Pet;
}

export default function EditPetForm({ pet }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditPetFormData>({
    resolver: zodResolver(editPetSchema),
    defaultValues: {
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      city: pet.city,
      contactPhone: pet.contactPhone,
      status: pet.status,
      description: pet.description,
    },
  });

  async function onSubmit(data: EditPetFormData) {
    setFormError(null);

    try {
      await updatePet(pet.id, data);
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      queryClient.invalidateQueries({ queryKey: ["pet", pet.id] });
      navigate(`/pets/${pet.id}`);
    } catch {
      setFormError("No pudimos guardar los cambios. Intentá de nuevo.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
      <FormField label="Nombre" error={errors.name?.message}>
        <Input {...register("name")} />
      </FormField>

      <FormField label="Especie" error={errors.species?.message}>
        <Input {...register("species")} />
      </FormField>

      <FormField label="Raza" error={errors.breed?.message}>
        <Input {...register("breed")} />
      </FormField>

      <FormField label="Ciudad" error={errors.city?.message}>
        <Input {...register("city")} />
      </FormField>

      <FormField label="Teléfono" error={errors.contactPhone?.message}>
        <Input {...register("contactPhone")} />
      </FormField>

      <FormField label="Estado" error={errors.status?.message}>
        <select {...register("status")} className="w-full rounded-lg border px-4 py-3">
          <option value="LOST">Perdido</option>
          <option value="FOUND">Encontrado</option>
        </select>
      </FormField>

      <FormField label="Descripción" error={errors.description?.message}>
        <textarea
          {...register("description")}
          className="w-full rounded-lg border px-4 py-3"
        />
      </FormField>

      {formError && <p className="mb-4 text-sm text-red-500">{formError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
