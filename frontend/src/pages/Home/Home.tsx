import { useQuery } from "@tanstack/react-query";

import Stats from "../../components/home/Stats";
import PetList from "../../components/home/PetList";
import Hero from "../../components/home/Hero";
import HowItWorks from "../../components/home/HowItWorks";
import { getPets } from "../../services/petService";

export default function Home() {
  const {
    data: pets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["pets"],
    queryFn: getPets,
  });

  return (
    <div className="space-y-20">
      <Hero />

      <Stats />

      {isLoading && (
        <p className="text-center text-gray-500">
          Cargando publicaciones...
        </p>
      )}

      {isError && (
        <p className="text-center text-red-500">
          No pudimos cargar las publicaciones. Intentá de nuevo más tarde.
        </p>
      )}

      {pets && <PetList pets={pets} />}

      <HowItWorks />
    </div>
  );
}
