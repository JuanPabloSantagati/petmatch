import { Router } from "express";

import { listPets, getPet, createPet } from "../controllers/pets.controller.js";

const router = Router();

router.get("/", listPets);
router.get("/:id", getPet);
router.post("/", createPet);

export default router;
