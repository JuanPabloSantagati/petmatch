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

// NOTE: intentionally not `createPetSchema.partial()`. In Zod 4, `.partial()` does not
// strip an inner `.default()` — an absent `breed` would parse to "Sin especificar" instead
// of "leave unchanged", silently wiping the field on every partial update. If `createPetSchema`
// ever gains another field with `.default()`, apply the same `.omit()`/`.extend()` treatment here.
export const updatePetSchema = createPetSchema
  .omit({ breed: true })
  .partial()
  .extend({ breed: z.string().min(1).optional() });

export type UpdatePetInput = z.infer<typeof updatePetSchema>;
