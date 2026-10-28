import { useId, useState, type ChangeEvent } from "react"
import { Navigate, useNavigate } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera, CircleAlert, MapPin } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import {
  getGetCurrentUserProfileApiV1UsersMeGetQueryKey,
  useUpdateCurrentUserProfileApiV1UsersMePatch,
  useUploadAvatarApiV1UsersMeAvatarPost,
} from "@/api/endpoints/users/users"
import { FormField } from "@/components/FormField"
import { BrandLogo } from "@/components/layout/BrandLogo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/errors"
import { MAX_AVATAR_BYTES } from "@/lib/image"
import { useAuthStore } from "@/stores/auth"

const alphabeticNameRegex = /^[\p{L}\s'-]+$/u

// SRS 3.2.3.3 & 3.2.3.5: First name, last name required, alphabetic, 2–50 characters.
const completeProfileSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "validation.required")
    .min(2, "validation.nameAlphabetic")
    .max(50, "validation.nameAlphabetic")
    .regex(alphabeticNameRegex, "validation.nameAlphabetic"),
  last_name: z
    .string()
    .trim()
    .min(1, "validation.required")
    .min(2, "validation.nameAlphabetic")
    .max(50, "validation.nameAlphabetic")
    .regex(alphabeticNameRegex, "validation.nameAlphabetic"),
  city: z.string().trim().max(100, "validation.nameAlphabetic").optional(),
  contact_info: z
    .string()
    .trim()
    .max(120, "validation.invalidContacts")
    .optional(),
})

type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>

export function CompleteProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputId = useId()
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const setUser = useAuthStore((state) => state.setUser)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar_url ?? null
  )
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    mode: "onBlur",
    defaultValues: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      city: user?.city ?? "",
      contact_info: user?.contact_info ?? "",
    },
  })

  const watchedFirstName = useWatch({ control, name: "first_name" })

  const updateProfileMutation = useUpdateCurrentUserProfileApiV1UsersMePatch()
  const uploadAvatarMutation = useUploadAvatarApiV1UsersMeAvatarPost()

  if (!isLoading && !user) {
    return <Navigate to="/login" replace />
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoError(null)

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > MAX_AVATAR_BYTES
    ) {
      setPhotoError(t("validation.photoFormatSize"))
      event.target.value = ""
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const fieldError = (key?: string) => (key ? t(key) : undefined)
  const dash = t("profile.notProvided")
  const initial = (
    watchedFirstName?.trim()?.[0] ||
    user?.first_name?.trim()?.[0] ||
    user?.email?.trim()?.[0] ||
    dash
  ).toUpperCase()

  const isBusy =
    updateProfileMutation.isPending || uploadAvatarMutation.isPending

  const onSubmit = async (values: CompleteProfileFormValues) => {
    setServerError(null)
    const cleanCity = values.city?.trim() || null
    const cleanContact = values.contact_info?.trim() || null

    try {
      let latestUser = user
      if (avatarFile) {
        latestUser = await uploadAvatarMutation.mutateAsync({
          data: { file: avatarFile },
        })
      }
      const updated = await updateProfileMutation.mutateAsync({
        data: {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          city: cleanCity,
          contact_info: cleanContact,
        },
      })
      setUser({
        ...user,
        ...latestUser,
        ...updated,
      })
      void queryClient.invalidateQueries({
        queryKey: getGetCurrentUserProfileApiV1UsersMeGetQueryKey(),
      })
      void navigate({ to: "/", replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error, t("profile.updateFailed")))
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center py-8">
      <div className="mb-6 hidden sm:block">
        <BrandLogo size="md" />
      </div>

      <Card className="w-full rounded-2xl border border-border bg-card p-2 shadow-sm sm:p-6">
        <CardHeader className="justify-items-center space-y-2 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("completeProfile.title")}
          </CardTitle>
          <CardDescription className="mx-auto max-w-sm text-sm text-muted-foreground">
            {t("completeProfile.subtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-2.5">
            <div className="relative">
              <Avatar className="size-24 sm:size-28">
                {avatarPreview && (
                  <AvatarImage src={avatarPreview} alt={watchedFirstName || ""} />
                )}
                <AvatarFallback className="bg-muted text-3xl font-bold text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>

              <Label
                htmlFor={fileInputId}
                className="absolute right-0 bottom-0 flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xs transition-colors hover:bg-muted"
                aria-label={t("completeProfile.uploadPhoto")}
              >
                <Camera className="size-4" aria-hidden="true" />
              </Label>
            </div>

            <Input
              id={fileInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void handlePhotoChange(e)}
              className="sr-only"
              disabled={isBusy}
            />

            <Label
              htmlFor={fileInputId}
              className="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card px-3.5 text-xs font-medium text-foreground shadow-2xs transition-colors hover:bg-muted"
            >
              {t("completeProfile.uploadPhoto")}
            </Label>

            <p className="text-xs text-muted-foreground">
              {t("completeProfile.photoHint")}
            </p>

            {photoError && (
              <p
                role="alert"
                className="flex items-center gap-1.5 text-xs text-destructive"
              >
                <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{photoError}</span>
              </p>
            )}
          </div>

          {serverError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive"
            >
              <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          <form
            noValidate
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label={t("completeProfile.firstName")}
                requiredIndicator
                autoComplete="given-name"
                placeholder={t("completeProfile.firstNamePlaceholder")}
                error={fieldError(errors.first_name?.message)}
                disabled={isBusy}
                {...register("first_name")}
              />

              <FormField
                label={t("completeProfile.lastName")}
                requiredIndicator
                autoComplete="family-name"
                placeholder={t("completeProfile.lastNamePlaceholder")}
                error={fieldError(errors.last_name?.message)}
                disabled={isBusy}
                {...register("last_name")}
              />
            </div>

            <FormField
              label={t("completeProfile.city")}
              autoComplete="address-level2"
              placeholder={t("completeProfile.cityPlaceholder")}
              startIcon={<MapPin />}
              error={fieldError(errors.city?.message)}
              disabled={isBusy}
              {...register("city")}
            />

            <FormField
              label={t("completeProfile.contacts")}
              optionalText={t("common.optional")}
              autoComplete="tel"
              placeholder={t("completeProfile.contactsPlaceholder")}
              error={fieldError(errors.contact_info?.message)}
              disabled={isBusy}
              {...register("contact_info")}
            />

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                className="h-11 w-full text-sm font-medium"
                isLoading={isBusy}
              >
                {t("completeProfile.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        {t("completeProfile.footerNote")}
      </p>
    </div>
  )
}

