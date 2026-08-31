import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";

import { registerSchema, type RegisterFormData } from "./Register.schema";
import FormField from "../../components/common/FormField";
import { Button, Input, Card } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterFormData) {
    setFormError(null);

    try {
      await registerUser(data.name, data.email, data.password);
      navigate("/");
    } catch {
      setFormError("No pudimos crear tu cuenta. ¿El email ya está registrado?");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Crear cuenta</h1>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <FormField label="Nombre" error={errors.name?.message}>
            <Input {...register("name")} />
          </FormField>

          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </FormField>

          <FormField label="Contraseña" error={errors.password?.message}>
            <Input type="password" {...register("password")} />
          </FormField>

          {formError && <p className="mb-4 text-sm text-red-500">{formError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creando cuenta..." : "Registrarme"}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-gray-500">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="text-brand-600 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
