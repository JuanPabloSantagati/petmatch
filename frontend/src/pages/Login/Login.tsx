import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";

import { loginSchema, type LoginFormData } from "./Login.schema";
import FormField from "../../components/common/FormField";
import { Button, Input, Card } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFormData) {
    setFormError(null);

    try {
      await login(data.email, data.password);
      navigate("/");
    } catch {
      setFormError("Email o contraseña incorrectos");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Iniciar sesión</h1>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </FormField>

          <FormField label="Contraseña" error={errors.password?.message}>
            <Input type="password" {...register("password")} />
          </FormField>

          {formError && <p className="mb-4 text-sm text-red-500">{formError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-gray-500">
        ¿No tenés cuenta?{" "}
        <Link to="/register" className="text-brand-600 hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
