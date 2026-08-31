import { Link } from "react-router-dom";
import { Button } from "../../components/ui";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-6xl">🐾</p>

      <h1 className="text-3xl font-bold text-gray-800">
        Página no encontrada
      </h1>

      <p className="text-gray-500">
        Esta mascota se nos escapó del mapa.
      </p>

      <Link to="/">
        <Button className="mt-2">Volver al inicio</Button>
      </Link>
    </div>
  );
}
