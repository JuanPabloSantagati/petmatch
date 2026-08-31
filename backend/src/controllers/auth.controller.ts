import bcrypt from "bcrypt";
import type { Request, Response, NextFunction } from "express";

import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

function toPublicUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", issues: parsed.error.issues });
      return;
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      res.status(409).json({ error: "Ese email ya está registrado" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    const token = signToken(user.id);

    res.status(201).json({ user: toPublicUser(user), token });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", issues: parsed.error.issues });
      return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Email o contraseña incorrectos" });
      return;
    }

    const token = signToken(user.id);

    res.json({ user: toPublicUser(user), token });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}
