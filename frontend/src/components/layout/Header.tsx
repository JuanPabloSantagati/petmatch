import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        <Link
          to="/"
          className="text-2xl font-bold text-brand-500"
        >
          🐾 PetMatch
        </Link>

        <nav className="flex items-center gap-6">

          <Link to="/">Inicio</Link>

          <Link to="/login">
            Iniciar sesión
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
          >
            Registrarse
          </Link>

        </nav>

      </div>
    </header>
  );
}