import CreatePetForm from "./CreatePetForm";

export default function CreatePet() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">
        Publicar mascota
      </h1>

      <CreatePetForm />
    </div>
  );
}