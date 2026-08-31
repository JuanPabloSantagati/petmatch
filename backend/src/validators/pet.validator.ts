import { z } from "zod";

export const createPetSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  species: z.string().min(1, "La especie es obligatoria"),
  breed: z.string().min(1).default("Sin especificar"),
  city: z.string().min(2, "La ciudad es obligatoria"),
  contactPhone: z.string().min(8, "Ingresá un teléfono válido"),
  status: z.enum(["LOST", "FOUND"], { message: "Seleccioná un estado" }),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  image: z.string().url().optional(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;

export const updatePetSchema = createPetSchema.partial();

export type UpdatePetInput = z.infer<typeof updatePetSchema>;
