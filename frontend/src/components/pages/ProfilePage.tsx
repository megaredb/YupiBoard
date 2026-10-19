import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useUpdateCurrentUserProfileApiV1UsersMePatch } from "@/api/endpoints/users/users"
import type { UserRead } from "@/api/model"
import { useAuthStore } from "@/stores/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, Mail, Shield, User } from "lucide-react"

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { t } = useTranslation()
  const { user, isAuthenticated, updateUser, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
    },
  })

  const updateMutation = useUpdateCurrentUserProfileApiV1UsersMePatch({
    mutation: {
      onSuccess: (data: UserRead) => {
        updateUser(data)
        setSuccessMsg(t("profile.updatedSuccess"))
        setTimeout(() => setSuccessMsg(null), 3000)
      },
    },
  })

  const onSubmit = (values: ProfileFormValues) => {
    updateMutation.mutate({ data: { full_name: values.full_name } })
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-slate-400">{t("profile.loginRequired")}</p>
        <Button onClick={() => navigate({ to: "/login" })}>{t("profile.goToLogin")}</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t("profile.title")}</h1>
          <p className="text-sm text-slate-400">{t("profile.subtitle")}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            clearAuth()
            navigate({ to: "/login" })
          }}
        >
          {t("nav.logout")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="md:col-span-1 flex flex-col items-center text-center p-6 space-y-4">
          <div className="w-24 h-24 rounded-full bg-linear-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-500/20">
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user.full_name || t("profile.unnamed")}</h2>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant={user.is_verified ? "success" : "warning"}>
              {user.is_verified ? t("common.verified") : t("common.unverified")}
            </Badge>
            {user.is_superuser && <Badge variant="default">{t("common.admin")}</Badge>}
          </div>
        </Card>

        {/* Profile Details and Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t("profile.detailsTitle")}</CardTitle>
            <CardDescription>{t("profile.detailsSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {t("profile.fullName")}
                </label>
                <Input
                  {...register("full_name")}
                  error={errors.full_name?.message}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {t("profile.emailReadOnly")}
                </label>
                <Input value={user.email} disabled className="opacity-60 cursor-not-allowed" />
              </div>

              <Button
                type="submit"
                disabled={!isDirty || updateMutation.isPending}
                isLoading={updateMutation.isPending}
              >
                {t("common.save")}
              </Button>
            </form>

            <div className="border-t border-white/5 pt-4 space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {t("profile.registeredOn")}
                </span>
                <span className="font-mono text-slate-300">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  {t("profile.userId")}
                </span>
                <span className="font-mono text-slate-400 text-[10px]">{user.id}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
