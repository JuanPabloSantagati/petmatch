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
