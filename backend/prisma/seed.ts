import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.pet.deleteMany();

  await prisma.pet.createMany({
    data: [
      {
        name: "Rocky",
        species: "Perro",
        breed: "Golden Retriever",
        city: "Rosario",
        image: "https://placedog.net/500?id=1",
        status: "LOST",
        state: "OPEN",
        description: "Muy amigable, llevaba collar azul.",
        contactPhone: "+54 341 555-0101",
      },
      {
        name: "Mishi",
        species: "Gato",
        breed: "Mestizo",
        city: "Rosario",
        image: "https://placecats.com/500/300",
        status: "FOUND",
        state: "OPEN",
        description: "Encontrado cerca del parque.",
        contactPhone: "+54 341 555-0102",
      },
      {
        name: "Luna",
        species: "Perro",
        breed: "Border Collie",
        city: "Córdoba",
        image: "https://placedog.net/500?id=3",
        status: "LOST",
        state: "OPEN",
        description: "Muy juguetona.",
        contactPhone: "+54 351 555-0103",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
