import { Link } from "react-router-dom";
import { Button } from "../ui";

export default function Hero() {
  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 px-8 py-20 text-center text-white shadow-lg">
      <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight md:text-5xl">
        Encontrá a tu mascota
      </h1>

      <p className="mx-auto mt-4 max-w-xl text-lg text-brand-50">
        Tu compañero de vida está esperando por vos. Publicá o buscá
        mascotas perdidas y encontradas en tu ciudad.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link to="/publicar">
          <Button variant="light">Publicar mascota</Button>
        </Link>

        <Link to="#publicaciones">
          <Button variant="inverse">Ver publicaciones</Button>
        </Link>
      </div>
    </section>
  );
}
