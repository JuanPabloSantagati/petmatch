# Sprint 2 — Autenticación (diseño)

## Objetivo
Agregar registro/login con JWT y hacer que crear, editar y eliminar
publicaciones de mascotas requiera un usuario dueño autenticado.
Un solo rol (`USER`) por ahora — no hay roles ni permisos diferenciados.

## Alcance
- Registro, login, sesión vía JWT (sin refresh token, sin verificación de email).
- Ownership de `Pet`: cada mascota queda asociada al usuario que la publicó.
- Editar y eliminar mascota (pendiente de Sprint 3), protegidos por ownership.
- Fuera de alcance: recuperación de contraseña, roles/admin, OAuth social.

## Backend

### Modelo de datos (Prisma)
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
  // ...campos existentes
  ownerId String?
  owner   User?   @relation(fields: [ownerId], references: [id])
}
```
`ownerId` nullable para no romper las filas ya sembradas; se migra con
`prisma migrate dev`.

### Dependencias nuevas
`bcrypt`, `jsonwebtoken` (+ `@types/jsonwebtoken`). Nueva env var
`JWT_SECRET` en `.env`/`.env.example`.

### Auth
- `POST /api/auth/register` — body `{ name, email, password }`, valida con
  zod, hashea con bcrypt (10 rounds), crea `User`, devuelve `{ user, token }`.
- `POST /api/auth/login` — body `{ email, password }`, compara hash,
  devuelve `{ user, token }` o 401.
- `GET /api/auth/me` — protegido, devuelve el usuario del token.
- JWT payload: `{ sub: userId }`, expiración `7d`, firmado con `JWT_SECRET`.
- `src/middleware/requireAuth.ts`: lee header `Authorization: Bearer <token>`,
  verifica con `jsonwebtoken`, adjunta `req.userId`; 401 si falta o es inválido.

### Pets
- `POST /api/pets` pasa a requerir `requireAuth`; `ownerId` se toma de
  `req.userId`, no del body.
- `PUT /api/pets/:id` (nuevo) y `DELETE /api/pets/:id` (nuevo): requieren
  `requireAuth`; si `pet.ownerId !== req.userId` → 403. `PUT` reusa
  `createPetSchema.partial()` para validar.
- `GET /` y `GET /:id` siguen públicos, sin cambios.

### Errores
Mismo patrón que hoy (`errorHandler` + `next(err)`), agregando 401/403
donde corresponda en los controllers/middleware nuevos.

## Frontend

### Servicios y estado
- `frontend/src/services/authService.ts`: `register`, `login`, `me`.
- `frontend/src/context/AuthContext.tsx`: guarda `{ user, token }` en
  estado + `localStorage` (`petmatch_token`), expone `login`, `register`,
  `logout`, `isAuthenticated`. Se hidrata leyendo `localStorage` al montar
  y llamando `GET /me` para validar el token.
- `frontend/src/services/api.ts`: interceptor de request que agrega
  `Authorization: Bearer <token>` si existe en `localStorage`.

### UI
- `Login.tsx` y `Register.tsx`: formularios reales con `FormField` +
  validación zod (mismo patrón que `CreatePetForm`), llaman a
  `AuthContext.login`/`register` y redirigen a `/` al éxito.
- `ProtectedRoute.tsx` (nuevo, en `routes/`): si no hay sesión, redirige a
  `/login`; envuelve `/publicar` en `AppRouter.tsx`.
- `PetCard` y `PetDetail`: muestran acciones editar/eliminar solo si
  `user?.id === pet.ownerId`. Eliminar llama a `deletePet` (nuevo en
  `petService.ts`) e invalida la query `["pets"]`.
- Falta agregar `EditPet` (reusa `CreatePetForm` en modo edición) —
  se decide al armar el plan de implementación si entra en este sprint
  o se separa.

## Testing
Manual, contra la API corriendo localmente:
1. Registro → login → token guardado.
2. Crear mascota autenticado → aparece con `ownerId` propio.
3. Intentar editar/eliminar esa mascota logueado como otro usuario → 403.
4. Editar/eliminar como dueño → funciona.
5. En el navegador: sin sesión no se ve botón "Publicar" activo (redirige a
   login); con sesión se ven los botones de dueño solo en las propias
   publicaciones.

## Decisiones ya tomadas
- Un solo rol `USER` (sin admin por ahora).
- Token en `localStorage`, sin cookie httpOnly.
- Solo access token, sin refresh token (expira en 7 días).
