import "dotenv/config";
import express from "express";
import cors from "cors";

import petsRouter from "./routes/pets.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/pets", petsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});

app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
