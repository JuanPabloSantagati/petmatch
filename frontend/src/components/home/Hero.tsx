import { Button } from "../ui";

export default function Hero() {
  return (
    <section>
      <h1>Encontrá a tu mascota</h1>

      <p>
        Tu compañero de vida está esperando por vos.
      </p>

      <Button>
        Buscar
      </Button>

      <Button variant="secondary">
        Publicar
      </Button>
    </section>
  );
}