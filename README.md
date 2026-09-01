# 🐾 PetMatch

Aplicación web para encontrar mascotas perdidas y facilitar el reencuentro con sus dueños.

## Tecnologías

### Frontend
- React
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express
- TypeScript

### Base de datos
- PostgreSQL

## Desarrollo local

Requisitos: Node.js 20+, Docker Desktop.

1. Levantar PostgreSQL:
   ```
   docker compose up -d
   ```
2. Backend:
   ```
   cd backend
   cp .env.example .env
   npm install
   npx prisma db push
   npm run seed
   npm run dev
   ```
   La API queda en `http://localhost:4000/api`.
3. Frontend (en otra terminal):
   ```
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
   La app queda en `http://localhost:5173`.

## Estado del proyecto

🚧 En desarrollo.