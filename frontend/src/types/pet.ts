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
}
