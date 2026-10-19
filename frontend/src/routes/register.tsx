import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegisterApiV1AuthRegisterPost } from "@/api/endpoints/auth/auth";
import type { TokenResponse } from "@/api/model";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Lock, Mail, User } from "lucide-react";

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Route = createFileRoute("/register")({
  component: RegisterComponent,
});

function RegisterComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useRegisterApiV1AuthRegisterPost({
    mutation: {
      onSuccess: (data: TokenResponse) => {
        setAuth(data.user, data.access_token, data.refresh_token);
        navigate({ to: "/" });
      },
      onError: (err: unknown) => {
        const errorResponse = err as {
          response?: { data?: { detail?: string } };
        };
        const detail =
          errorResponse?.response?.data?.detail ||
          t("register.regFailed");
        setServerError(detail);
      },
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    setServerError(null);
    registerMutation.mutate({
      data: {
        email: values.email,
        password: values.password,
        full_name: values.full_name,
      },
    });
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="glow-effect border-indigo-500/20">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t("register.title")}
          </CardTitle>
          <CardDescription>
            {t("register.description")}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {t("register.fullName")}
              </label>
              <Input
                placeholder={t("register.namePlaceholder")}
                {...register("full_name")}
                error={errors.full_name?.message}
                disabled={registerMutation.isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {t("register.email")}
              </label>
              <Input
                type="email"
                placeholder={t("register.emailPlaceholder")}
                {...register("email")}
                error={errors.email?.message}
                disabled={registerMutation.isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                {t("register.password")}
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                error={errors.password?.message}
                disabled={registerMutation.isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                {t("register.confirmPassword")}
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
                disabled={registerMutation.isPending}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              isLoading={registerMutation.isPending}
            >
              {t("register.submit")}
            </Button>

            <div className="text-center text-xs text-slate-400">
              {t("register.hasAccount")}{" "}
              <Link
                to="/login"
                className="text-indigo-400 hover:underline font-medium"
              >
                {t("register.signIn")}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
