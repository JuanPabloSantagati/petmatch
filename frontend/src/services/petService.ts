import { api } from "./api";
import type { Pet, PetStatus } from "../types/pet";

export interface CreatePetInput {
  name: string;
  species: string;
  breed?: string;
  city: string;
  contactPhone: string;
  status: PetStatus;
  description: string;
}

export async function getPets(): Promise<Pet[]> {
  const { data } = await api.get<Pet[]>("/pets");
  return data;
}

export async function getPetById(id: string): Promise<Pet> {
  const { data } = await api.get<Pet>(`/pets/${id}`);
  return data;
}

export async function createPet(input: CreatePetInput): Promise<Pet> {
  const { data } = await api.post<Pet>("/pets", input);
  return data;
}

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
