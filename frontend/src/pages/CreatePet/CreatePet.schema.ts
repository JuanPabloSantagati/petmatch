import { z } from "zod";

export const createPetSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres"),
  city: z
    .string()
    .min(2, "La ciudad es obligatoria"),
  breed: z
    .string()
    .optional(),
  phone: z
  .string()
  .min(8, "Ingresá un teléfono válido"),
  type: z.enum(
  ["dog", "cat", "bird", "other"],
  {
    message: "Seleccioná un tipo de mascota",
  }
),
  status: z.enum(
  ["LOST", "FOUND"],
  {
    message: "Seleccioná el estado",
  }
),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
});

export type CreatePetFormData =
  z.infer<typeof createPetSchema>;