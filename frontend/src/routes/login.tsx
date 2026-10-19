import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoginApiV1AuthLoginPost } from "@/api/endpoints/auth/auth";
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
import { AlertCircle, Lock, Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useLoginApiV1AuthLoginPost({
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
          t("login.authFailed");
        setServerError(detail);
      },
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    setServerError(null);
    loginMutation.mutate({ data: values });
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="glow-effect border-indigo-500/20">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t("login.title")}
          </CardTitle>
          <CardDescription>
            {t("login.description")}
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
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {t("login.email")}
              </label>
              <Input
                type="email"
                placeholder={t("login.emailPlaceholder")}
                {...register("email")}
                error={errors.email?.message}
                disabled={loginMutation.isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                {t("login.password")}
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                error={errors.password?.message}
                disabled={loginMutation.isPending}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              isLoading={loginMutation.isPending}
            >
              {t("login.submit")}
            </Button>

            <div className="text-center text-xs text-slate-400">
              {t("login.noAccount")}{" "}
              <Link
                to="/register"
                className="text-indigo-400 hover:underline font-medium"
              >
                {t("login.createAccount")}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
