import type { Request, Response, NextFunction } from "express";

import { prisma } from "../lib/prisma.js";
import { createPetSchema, updatePetSchema } from "../validators/pet.validator.js";

function placeholderImage(species: string): string {
  return `https://placehold.co/500x300/f97316/white?text=${encodeURIComponent(species)}`;
}

export async function listPets(_req: Request, res: Response, next: NextFunction) {
  try {
    const pets = await prisma.pet.findMany({ orderBy: { createdAt: "desc" } });
    res.json(pets);
  } catch (err) {
    next(err);
  }
}

export async function getPet(req: Request, res: Response, next: NextFunction) {
  try {
    const pet = await prisma.pet.findUnique({ where: { id: req.params.id } });

    if (!pet) {
      res.status(404).json({ error: "Mascota no encontrada" });
      return;
    }

    res.json(pet);
  } catch (err) {
    next(err);
  }
}

export async function createPet(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createPetSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", issues: parsed.error.issues });
      return;
    }

    const data = parsed.data;

    const pet = await prisma.pet.create({
      data: {
        ...data,
        image: data.image ?? placeholderImage(data.species),
        ownerId: req.userId,
      },
    });

    res.status(201).json(pet);
  } catch (err) {
    next(err);
  }
}

export async function updatePet(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.pet.findUnique({ where: { id: req.params.id } });

    if (!existing) {
      res.status(404).json({ error: "Mascota no encontrada" });
      return;
    }

    if (existing.ownerId !== req.userId) {
      res.status(403).json({ error: "No podés editar esta publicación" });
      return;
    }

    const parsed = updatePetSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", issues: parsed.error.issues });
      return;
    }

    const pet = await prisma.pet.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    res.json(pet);
  } catch (err) {
    next(err);
  }
}

export async function deletePet(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.pet.findUnique({ where: { id: req.params.id } });

    if (!existing) {
      res.status(404).json({ error: "Mascota no encontrada" });
      return;
    }

    if (existing.ownerId !== req.userId) {
      res.status(403).json({ error: "No podés eliminar esta publicación" });
      return;
    }

    await prisma.pet.delete({ where: { id: req.params.id } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
