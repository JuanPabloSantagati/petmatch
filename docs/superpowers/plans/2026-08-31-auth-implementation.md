# Sprint 2 — Autenticación Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add JWT-based register/login and make creating, editing and deleting a pet require its authenticated owner.

**Architecture:** Backend gets a `User` model, bcrypt password hashing, a JWT-issuing `/api/auth` router, and a `requireAuth` middleware that protects `/api/pets` writes and enforces `pet.ownerId === req.userId`. Frontend gets an `authService` + `AuthContext` that stores the JWT in `localStorage` and injects it via an axios interceptor, real Login/Register forms, a `ProtectedRoute` wrapper, and owner-only edit/delete UI on `PetDetail`.

**Tech Stack:** Express, Prisma/Postgres, zod, bcrypt, jsonwebtoken (backend); React, react-hook-form + zodResolver, TanStack Query, React Router (frontend).

**Spec:** `docs/superpowers/specs/2026-08-31-auth-design.md`

## Global Constraints

- Single role, no admin/permissions system — every registered user is equivalent.
- JWT stored in `localStorage` (key `petmatch_token`), no httpOnly cookie.
- Access token only, `expiresIn: "7d"`, no refresh token.
- No automated test framework exists in this repo yet (`backend/package.json` and `frontend/package.json` have no test runner) — this plan verifies each task manually (curl for the API, the browser for the UI) instead of introducing one. Do not add a test framework as a side effect of this plan.
- Backend imports use explicit `.js` extensions (ESM + `"type": "module"`) — follow the pattern already in `backend/src/controllers/pets.controller.ts`.

---

### Task 1: User model, Pet ownership, and auth dependencies

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/.env.example`
- Modify: `backend/package.json` (via `npm install`)

**Interfaces:**
- Produces: `User` Prisma model (`id`, `name`, `email`, `passwordHash`, `createdAt`), `Pet.ownerId String?` + `Pet.owner User?` relation. `JWT_SECRET` env var. `bcrypt` and `jsonwebtoken` available as dependencies.

- [ ] **Step 1: Add the `User` model and `Pet.ownerId` to the schema**

Edit `backend/prisma/schema.prisma`, adding the `User` model and the two new fields on `Pet`:

```prisma
model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  pets         Pet[]
}

model Pet {
  id           String    @id @default(uuid())
  name         String
  species      String
  breed        String
  city         String
  image        String
  status       PetStatus
  state        PetState  @default(OPEN)
  description  String
  contactPhone String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  ownerId      String?
  owner        User?     @relation(fields: [ownerId], references: [id])
}
```

- [ ] **Step 2: Install auth dependencies**

Run (from `backend/`):
```bash
cd backend
npm install bcrypt jsonwebtoken
npm install -D @types/bcrypt @types/jsonwebtoken
```

- [ ] **Step 3: Add `JWT_SECRET` to the env example**

Edit `backend/.env.example`, adding a line:
```
JWT_SECRET="change-me-to-a-long-random-string"
```
Add the same line (with a real random value) to your local `backend/.env` — it is gitignored, so this step only touches the example file in git.

- [ ] **Step 4: Push the schema**

This project has no `prisma/migrations` folder — its tables were created with `prisma db push`, not `migrate dev` (confirmed by `ls backend/prisma/migrations` returning "No such file or directory" against the running dev database). Running `migrate dev` against an untracked schema would try to create an initial migration and can prompt to reset the database. Follow the project's existing convention instead:

```bash
cd backend
npx prisma db push
```
Expected: `Your database is now in sync with your Prisma schema`, followed by an automatic `prisma generate` run. Existing seeded pets keep their data with `ownerId = NULL`.

- [ ] **Step 5: Verify**

```bash
npx prisma studio
```
Confirm a `User` table exists and `Pet` now has an `ownerId` column. Close Prisma Studio.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma backend/.env.example backend/package.json backend/package-lock.json
git commit -m "feat(backend): add User model and pet ownership to schema"
```

---

### Task 2: JWT helper and auth validators

**Files:**
- Create: `backend/src/lib/jwt.ts`
- Create: `backend/src/validators/auth.validator.ts`

**Interfaces:**
- Consumes: `User` model from Task 1.
- Produces: `signToken(userId: string): string`, `verifyToken(token: string): { sub: string }` (throws on invalid/expired token). `registerSchema`, `loginSchema` (zod), `RegisterInput`, `LoginInput` types.

- [ ] **Step 1: Write the JWT helper**

Create `backend/src/lib/jwt.ts`:

```typescript
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface TokenPayload {
  sub: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
```

- [ ] **Step 2: Write the auth validators**

Create `backend/src/validators/auth.validator.ts`:

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Ingresá un email válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Ingresá un email válido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 3: Verify it compiles**

```bash
cd backend
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/lib/jwt.ts backend/src/validators/auth.validator.ts
git commit -m "feat(backend): add JWT helper and auth validators"
```

---

### Task 3: Auth controller and routes

**Files:**
- Create: `backend/src/controllers/auth.controller.ts`
- Create: `backend/src/routes/auth.routes.ts`
- Modify: `backend/src/index.ts`

**Interfaces:**
- Consumes: `signToken` (Task 2), `registerSchema`/`loginSchema` (Task 2), `prisma` from `backend/src/lib/prisma.ts`.
- Produces: `POST /api/auth/register`, `POST /api/auth/login` (both public, both respond `{ user: { id, name, email }, token }`). `requireAuth` (Task 4) will be wired onto `GET /api/auth/me` in that task.

- [ ] **Step 1: Write the auth controller**

Create `backend/src/controllers/auth.controller.ts`:

```typescript
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
```

- [ ] **Step 2: Write the auth routes**

Create `backend/src/routes/auth.routes.ts`:

```typescript
import { Router } from "express";

import { register, login, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);

export default router;
```

This imports `requireAuth` from Task 4 — write Task 4 before running this task's verification step.

- [ ] **Step 3: Wire the router into the app**

Edit `backend/src/index.ts`, adding the import and mount alongside the existing `petsRouter`:

```typescript
import petsRouter from "./routes/pets.routes.js";
import authRouter from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
```

```typescript
app.use("/api/pets", petsRouter);
app.use("/api/auth", authRouter);
```

- [ ] **Step 4: Verify manually**

Start the API (`npm run dev` in `backend/`) and, in another terminal:

```bash
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@example.com","password":"password123"}'
```
Expected: `201` with `{ "user": { "id": ..., "name": "Ana", "email": "ana@example.com" }, "token": "..." }`.

```bash
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"password123"}'
```
Expected: `200` with the same shape. Save the `token` value for Task 5's verification.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/auth.controller.ts backend/src/routes/auth.routes.ts backend/src/index.ts
git commit -m "feat(backend): add register/login/me auth endpoints"
```

---

### Task 4: `requireAuth` middleware

**Files:**
- Create: `backend/src/middleware/requireAuth.ts`
- Modify: `backend/src/index.ts` (add the `Express.Request` type augmentation)

**Interfaces:**
- Consumes: `verifyToken` (Task 2).
- Produces: `requireAuth` Express middleware that sets `req.userId: string` or responds `401`.

- [ ] **Step 1: Augment Express's `Request` type**

Create `backend/src/types/express.d.ts`:

```typescript
declare namespace Express {
  export interface Request {
    userId?: string;
  }
}
```

- [ ] **Step 2: Write the middleware**

Create `backend/src/middleware/requireAuth.ts`:

```typescript
import type { Request, Response, NextFunction } from "express";

import { verifyToken } from "../lib/jwt.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd backend
npx tsc --noEmit
```
Expected: no errors (this also confirms `req.userId` type-checks in `auth.controller.ts`'s `me`).

- [ ] **Step 4: Verify manually**

With the API running:
```bash
curl -s http://localhost:4000/api/auth/me
```
Expected: `401 { "error": "No autenticado" }`.

```bash
curl -s http://localhost:4000/api/auth/me -H "Authorization: Bearer <token from Task 3>"
```
Expected: `200` with `{ "user": { ... } }`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/requireAuth.ts backend/src/types/express.d.ts
git commit -m "feat(backend): add requireAuth middleware"
```

---

### Task 5: Protect pet creation and add owner-only update/delete

**Files:**
- Modify: `backend/src/controllers/pets.controller.ts`
- Modify: `backend/src/routes/pets.routes.ts`
- Modify: `backend/src/validators/pet.validator.ts`

**Interfaces:**
- Consumes: `requireAuth` (Task 4).
- Produces: `updatePetSchema` (zod). `updatePet`, `deletePet` controllers. `PUT /api/pets/:id`, `DELETE /api/pets/:id` (both `requireAuth`-protected, both `403` if `pet.ownerId !== req.userId`). `POST /api/pets` now `requireAuth`-protected and sets `ownerId` from `req.userId`.

- [ ] **Step 1: Add the update schema**

Edit `backend/src/validators/pet.validator.ts`, appending:

```typescript
export const updatePetSchema = createPetSchema.partial();

export type UpdatePetInput = z.infer<typeof updatePetSchema>;
```

- [ ] **Step 2: Update the controller**

Edit `backend/src/controllers/pets.controller.ts`. Change the `createPet` body to attach the owner, and add `updatePet`/`deletePet`:

```typescript
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
```

- [ ] **Step 3: Wire the routes**

Replace `backend/src/routes/pets.routes.ts` with:

```typescript
import { Router } from "express";

import {
  listPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
} from "../controllers/pets.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", listPets);
router.get("/:id", getPet);
router.post("/", requireAuth, createPet);
router.put("/:id", requireAuth, updatePet);
router.delete("/:id", requireAuth, deletePet);

export default router;
```

- [ ] **Step 4: Verify manually**

With the API running and `<token>` from Task 3:

```bash
curl -s -X POST http://localhost:4000/api/pets \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"name":"Firulais","species":"Perro","city":"CABA","contactPhone":"1122334455","status":"LOST","description":"Perdido en el parque"}'
```
Expected: `201`, response includes `"ownerId"` matching the token's user. Save the returned `id` as `<petId>`.

```bash
curl -s -X POST http://localhost:4000/api/pets \
  -H "Content-Type: application/json" \
  -d '{"name":"X","species":"Perro","city":"CABA","contactPhone":"1122334455","status":"LOST","description":"sin token"}'
```
Expected: `401` (no `Authorization` header).

```bash
curl -s -X PUT http://localhost:4000/api/pets/<petId> \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"description":"Encontrado, gracias a todos"}'
```
Expected: `200`, `description` updated.

Register a second user, log in, and retry the same `PUT` (and a `DELETE`) with the second user's token:
Expected: `403` for both.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/pets.controller.ts backend/src/routes/pets.routes.ts backend/src/validators/pet.validator.ts
git commit -m "feat(backend): protect pet creation and add owner-only edit/delete"
```

---

### Task 6: Frontend auth service and token injection

**Files:**
- Create: `frontend/src/services/authService.ts`
- Create: `frontend/src/types/user.ts`
- Modify: `frontend/src/services/api.ts`

**Interfaces:**
- Produces: `User` type (`id`, `name`, `email`). `AuthResponse` type (`{ user: User; token: string }`). `register(input): Promise<AuthResponse>`, `login(input): Promise<AuthResponse>`, `me(): Promise<{ user: User }>`. `TOKEN_STORAGE_KEY = "petmatch_token"` constant, exported for `AuthContext` (Task 7) to reuse. `api` axios instance now attaches `Authorization` automatically.

- [ ] **Step 1: Add the `User` type**

Create `frontend/src/types/user.ts`:

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
}
```

- [ ] **Step 2: Write the auth service**

Create `frontend/src/services/authService.ts`:

```typescript
import { api } from "./api";
import type { User } from "../types/user";

export const TOKEN_STORAGE_KEY = "petmatch_token";

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", input);
  return data;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", input);
  return data;
}

export async function me(): Promise<{ user: User }> {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data;
}
```

- [ ] **Step 3: Inject the token in every request**

Replace `frontend/src/services/api.ts` with:

```typescript
import axios from "axios";
import { TOKEN_STORAGE_KEY } from "./authService";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

This creates a circular import between `api.ts` and `authService.ts` (the latter imports `api`, the former now imports `TOKEN_STORAGE_KEY` from it). This is safe here because `TOKEN_STORAGE_KEY` is a constant with no dependency on `api` at module-init time, but if it causes a bundler warning, move `TOKEN_STORAGE_KEY` into its own `frontend/src/services/tokenStorage.ts` file and import it from both.

- [ ] **Step 4: Verify it compiles**

```bash
cd frontend
npm run build
```
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/authService.ts frontend/src/services/api.ts frontend/src/types/user.ts
git commit -m "feat(frontend): add auth service and JWT request interceptor"
```

---

### Task 7: `AuthContext`

**Files:**
- Create: `frontend/src/context/AuthContext.tsx`
- Modify: `frontend/src/main.tsx`

**Interfaces:**
- Consumes: `authService` (Task 6).
- Produces: `AuthProvider` component, `useAuth()` hook returning `{ user: User | null, isAuthenticated: boolean, isLoading: boolean, login, register, logout }`.

- [ ] **Step 1: Write the context**

Create `frontend/src/context/AuthContext.tsx`:

```typescript
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import * as authService from "../services/authService";
import { TOKEN_STORAGE_KEY } from "../services/authService";
import type { User } from "../types/user";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      setIsLoading(false);
      return;
    }

    authService
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem(TOKEN_STORAGE_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { user, token } = await authService.login({ email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(user);
  }

  async function register(name: string, email: string, password: string) {
    const { user, token } = await authService.register({ name, email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }

  return context;
}
```

- [ ] **Step 2: Wrap the app**

Edit `frontend/src/main.tsx`:

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
```

- [ ] **Step 3: Verify it compiles**

```bash
cd frontend
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/context/AuthContext.tsx frontend/src/main.tsx
git commit -m "feat(frontend): add AuthContext with token persistence"
```

---

### Task 8: Real Login and Register forms

**Files:**
- Modify: `frontend/src/components/ui/Input.tsx`
- Create: `frontend/src/pages/Login/Login.schema.ts`
- Create: `frontend/src/pages/Register/Register.schema.ts`
- Modify: `frontend/src/pages/Login/Login.tsx`
- Modify: `frontend/src/pages/Register/Register.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Task 7), `FormField` (existing, `frontend/src/components/common/FormField.tsx`), `Button`/`Input` (existing, `frontend/src/components/ui`).

- [ ] **Step 0: Make `Input` forward its ref**

`frontend/src/pages/CreatePet/CreatePetForm.tsx` uses raw `<input>` elements instead of the shared `Input` component — because `Input` is a plain function component and doesn't forward refs, so `react-hook-form`'s `{...register("field")}` (which needs a real DOM ref) silently loses value tracking on it. This task's forms need `Input` with `register`, so fix it once at the source instead of repeating the raw-`<input>` workaround. Replace `frontend/src/components/ui/Input.tsx`:

```typescript
import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          "w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-brand-400",
          className
        )}
        {...props}
      />
    );
  }
);

export default Input;
```

Verify: `cd frontend && npm run build` still passes (existing `Input` usages are unaffected — same props, same rendered markup).

- [ ] **Step 1: Write the schemas**

Create `frontend/src/pages/Login/Login.schema.ts`:

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresá un email válido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

Create `frontend/src/pages/Register/Register.schema.ts`:

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Ingresá un email válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
```

- [ ] **Step 2: Write the Login page**

Replace `frontend/src/pages/Login/Login.tsx`:

```typescript
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";

import { loginSchema, type LoginFormData } from "./Login.schema";
import FormField from "../../components/common/FormField";
import { Button, Input, Card } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFormData) {
    setFormError(null);

    try {
      await login(data.email, data.password);
      navigate("/");
    } catch {
      setFormError("Email o contraseña incorrectos");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Iniciar sesión</h1>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </FormField>

          <FormField label="Contraseña" error={errors.password?.message}>
            <Input type="password" {...register("password")} />
          </FormField>

          {formError && <p className="mb-4 text-sm text-red-500">{formError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-gray-500">
        ¿No tenés cuenta?{" "}
        <Link to="/register" className="text-brand-600 hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Write the Register page**

Replace `frontend/src/pages/Register/Register.tsx`:

```typescript
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";

import { registerSchema, type RegisterFormData } from "./Register.schema";
import FormField from "../../components/common/FormField";
import { Button, Input, Card } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterFormData) {
    setFormError(null);

    try {
      await registerUser(data.name, data.email, data.password);
      navigate("/");
    } catch {
      setFormError("No pudimos crear tu cuenta. ¿El email ya está registrado?");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Crear cuenta</h1>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <FormField label="Nombre" error={errors.name?.message}>
            <Input {...register("name")} />
          </FormField>

          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </FormField>

          <FormField label="Contraseña" error={errors.password?.message}>
            <Input type="password" {...register("password")} />
          </FormField>

          {formError && <p className="mb-4 text-sm text-red-500">{formError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creando cuenta..." : "Registrarme"}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-gray-500">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="text-brand-600 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Verify manually**

With the backend and `npm run dev` (frontend) running, open the browser: register a new user at `/register` (redirects to `/`), reload the page (session persists via `AuthContext`'s hydration effect), log out is not wired to any UI yet (fine — comes with Task 9's header link), log in again at `/login` with the same credentials.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Login frontend/src/pages/Register frontend/src/components/ui/Input.tsx
git commit -m "feat(frontend): build real login and register forms"
```

---

### Task 9: `ProtectedRoute` and header session state

**Files:**
- Create: `frontend/src/routes/ProtectedRoute.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`
- Modify: `frontend/src/components/layout/Header.tsx`
- Create: `frontend/src/pages/CreatePet/CreatePet.tsx` update not needed (unchanged)

**Interfaces:**
- Consumes: `useAuth()` (Task 7).
- Produces: `ProtectedRoute` component (renders `<Outlet />` or redirects to `/login`).

- [ ] **Step 1: Write `ProtectedRoute`**

Create `frontend/src/routes/ProtectedRoute.tsx`:

```typescript
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <p className="py-20 text-center text-gray-500">Cargando...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

- [ ] **Step 2: Wire it into the router**

Replace `frontend/src/routes/AppRouter.tsx`:

```typescript
import { Route, Routes } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import NotFound from "../pages/NotFound/NotFound";
import CreatePet from "../pages/CreatePet/CreatePet";
import PetDetail from "../pages/PetDetail/PetDetail";
import EditPet from "../pages/EditPet/EditPet";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pets/:id" element={<PetDetail />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/publicar" element={<CreatePet />} />
          <Route path="/pets/:id/editar" element={<EditPet />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

`EditPet` doesn't exist yet — it's created in Task 11. This task's build will fail until Task 11 lands; run Tasks 9 and 11 back to back, or temporarily comment out the `/pets/:id/editar` route if you need Task 9 green on its own.

- [ ] **Step 3: Show session state in the header**

Replace `frontend/src/components/layout/Header.tsx`:

```typescript
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-2xl font-bold text-brand-500">
          🐾 PetMatch
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/">Inicio</Link>

          {isAuthenticated ? (
            <>
              <span className="text-gray-600">Hola, {user?.name}</span>
              <Button variant="secondary" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">Iniciar sesión</Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Verify manually**

With Task 11 also applied, in the browser: logged out, visiting `/publicar` redirects to `/login`; after logging in, `/publicar` loads and the header shows "Hola, `<name>`" and a "Cerrar sesión" button that logs you out and returns you to `/`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/routes/ProtectedRoute.tsx frontend/src/routes/AppRouter.tsx frontend/src/components/layout/Header.tsx
git commit -m "feat(frontend): add ProtectedRoute and session state in header"
```

---

### Task 10: Delete a pet (owner only)

**Files:**
- Modify: `frontend/src/services/petService.ts`
- Modify: `frontend/src/types/pet.ts`
- Modify: `frontend/src/pages/PetDetail/PetDetail.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Task 7).
- Produces: `deletePet(id: string): Promise<void>` in `petService`. `Pet.ownerId: string | null` in the `Pet` type. Delete button + confirm on `PetDetail`, visible only when `user?.id === pet.ownerId`.

- [ ] **Step 1: Add `ownerId` to the `Pet` type**

Edit `frontend/src/types/pet.ts`:

```typescript
export type PetStatus = "LOST" | "FOUND";
export type PetState = "OPEN" | "RESOLVED";

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  city: string;
  image: string;
  status: PetStatus;
  state: PetState;
  description: string;
  contactPhone: string;
  createdAt: string;
  ownerId: string | null;
}
```

- [ ] **Step 2: Add `deletePet` (and `updatePet`, used by Task 11) to `petService`**

Edit `frontend/src/services/petService.ts`, appending:

```typescript
export async function updatePet(
  id: string,
  input: Partial<CreatePetInput>
): Promise<Pet> {
  const { data } = await api.put<Pet>(`/pets/${id}`, input);
  return data;
}

export async function deletePet(id: string): Promise<void> {
  await api.delete(`/pets/${id}`);
}
```

- [ ] **Step 3: Add the delete button to `PetDetail`**

Edit `frontend/src/pages/PetDetail/PetDetail.tsx`, adding owner actions after the existing pet fields:

```typescript
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
  });

  function handleDelete() {
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
```

- [ ] **Step 4: Verify it compiles**

```bash
cd frontend
npm run build
```
Expected: fails until Task 11 creates `EditPet` (it's linked from this page and imported by `AppRouter`). If verifying Task 10 in isolation, temporarily stub `frontend/src/pages/EditPet/EditPet.tsx` with `export default function EditPet() { return null; }`, confirm the build passes, then delete the stub before Task 11.

- [ ] **Step 5: Verify manually**

Log in as the pet's owner, open its detail page: "Editar"/"Eliminar" buttons appear. Log in as a different user, open the same pet: no owner actions shown. As the owner, click "Eliminar", confirm the browser dialog: the pet is deleted and you're redirected to `/`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/petService.ts frontend/src/types/pet.ts frontend/src/pages/PetDetail/PetDetail.tsx
git commit -m "feat(frontend): add owner-only delete on pet detail"
```

---

### Task 11: Edit a pet (owner only)

**Files:**
- Create: `frontend/src/pages/EditPet/EditPet.schema.ts`
- Create: `frontend/src/pages/EditPet/EditPetForm.tsx`
- Create: `frontend/src/pages/EditPet/EditPet.tsx`

**Interfaces:**
- Consumes: `getPetById` (existing), `updatePet` (Task 10), `useAuth()` (Task 7).
- Produces: `EditPet` page mounted at `/pets/:id/editar` (Task 9's route).

- [ ] **Step 1: Write the edit schema**

Create `frontend/src/pages/EditPet/EditPet.schema.ts`:

```typescript
import { z } from "zod";

export const editPetSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  species: z.string().min(1, "La especie es obligatoria"),
  city: z.string().min(2, "La ciudad es obligatoria"),
  contactPhone: z.string().min(8, "Ingresá un teléfono válido"),
  status: z.enum(["LOST", "FOUND"], { message: "Seleccioná un estado" }),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
});

export type EditPetFormData = z.infer<typeof editPetSchema>;
```

- [ ] **Step 2: Write the form**

Create `frontend/src/pages/EditPet/EditPetForm.tsx`:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditPetFormData>({
    resolver: zodResolver(editPetSchema),
    defaultValues: {
      name: pet.name,
      species: pet.species,
      city: pet.city,
      contactPhone: pet.contactPhone,
      status: pet.status,
      description: pet.description,
    },
  });

  async function onSubmit(data: EditPetFormData) {
    await updatePet(pet.id, data);
    queryClient.invalidateQueries({ queryKey: ["pets"] });
    queryClient.invalidateQueries({ queryKey: ["pet", pet.id] });
    navigate(`/pets/${pet.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
      <FormField label="Nombre" error={errors.name?.message}>
        <Input {...register("name")} />
      </FormField>

      <FormField label="Especie" error={errors.species?.message}>
        <Input {...register("species")} />
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

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Write the page**

Create `frontend/src/pages/EditPet/EditPet.tsx`:

```typescript
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
```

- [ ] **Step 4: Verify it compiles**

```bash
cd frontend
npm run build
```
Expected: build succeeds (this also resolves Task 9's `EditPet` import and Task 10's link to `/pets/:id/editar`).

- [ ] **Step 5: Verify manually**

As the pet's owner, click "Editar" from `PetDetail`: form loads prefilled with the current values. Change the description, submit: redirected to `/pets/:id` showing the updated description. As a non-owner, navigating directly to `/pets/:id/editar` redirects back to the pet's detail page.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/EditPet
git commit -m "feat(frontend): add owner-only edit pet page"
```

---

## Post-plan checklist

- [ ] `cd backend && npx tsc --noEmit` passes
- [ ] `cd frontend && npm run build` passes
- [ ] Full manual flow in the browser: register → publish a pet → log out → log in as a different user → confirm no edit/delete buttons appear on someone else's pet → log back in as the owner → edit → delete
- [ ] `git push origin main`
