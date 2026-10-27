import { useId, useState, type ChangeEvent } from "react"
import { Navigate } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Camera,
  CheckCircle2,
  CircleAlert,
  ImagePlus,
  Lock,
  MapPin,
  Shield,
  Star,
} from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import {
  useGetCurrentUserProfileApiV1UsersMeGet,
  useUpdateCurrentUserProfileApiV1UsersMePatch,
} from "@/api/endpoints/users/users"
import { FormField } from "@/components/FormField"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { getErrorMessage } from "@/lib/errors"
import {
  MAX_AVATAR_BYTES,
  MAX_BANNER_BYTES,
  validateAndProcessImage,
} from "@/lib/image"
import { useAuthStore } from "@/stores/auth"

const alphabeticNameRegex = /^[\p{L}\s'-]+$/u

const editProfileSchema = z.object({
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
  bio: z.string().max(500, "validation.nameAlphabetic").optional(),
  contact_info: z
    .string()
    .trim()
    .max(120, "validation.invalidContacts")
    .optional(),
  location: z.string().trim().max(150, "validation.nameAlphabetic").optional(),
})

type EditProfileFormValues = z.infer<typeof editProfileSchema>

const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "validation.passwordMin")
      .max(128, "validation.passwordMax"),
    confirmPassword: z.string().min(1, "validation.confirmRequired"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "validation.mismatch",
    path: ["confirmPassword"],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

function formatMemberSince(isoDate: string | undefined, fallback: string): string {
  if (!isoDate) return fallback
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })
}

export function ProfilePage() {
  const { t } = useTranslation()
  const avatarInputId = useId()
  const bannerInputId = useId()
  const bioInputId = useId()
  const storeUser = useAuthStore((state) => state.user)
  const isAuthLoading = useAuthStore((state) => state.isLoading)
  const setUser = useAuthStore((state) => state.setUser)

  const { data: fetchedUser } = useGetCurrentUserProfileApiV1UsersMeGet({
    query: {
      enabled: Boolean(storeUser),
    },
  })

  const user = storeUser
    ? {
        ...fetchedUser,
        ...storeUser,
      }
    : fetchedUser ?? null

  const [isEditing, setIsEditing] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    mode: "onBlur",
    defaultValues: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      bio: user?.bio ?? "",
      contact_info: user?.contact_info ?? user?.contacts ?? "",
      location: user?.location ?? user?.city ?? "",
    },
  })

  const watchedBio = useWatch({ control, name: "bio" }) ?? ""

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const updateProfileMutation = useUpdateCurrentUserProfileApiV1UsersMePatch({
    mutation: {
      onSuccess: (data, variables) => {
        const merged = {
          ...user,
          ...data,
          first_name: variables.data.first_name ?? data.first_name ?? user?.first_name,
          last_name: variables.data.last_name ?? data.last_name ?? user?.last_name,
          bio: variables.data.bio !== undefined ? variables.data.bio : (data.bio ?? user?.bio),
          contact_info:
            variables.data.contact_info !== undefined
              ? variables.data.contact_info
              : (data.contact_info ?? user?.contact_info),
          contacts:
            variables.data.contacts !== undefined
              ? variables.data.contacts
              : (data.contacts ?? user?.contacts),
          city:
            variables.data.city !== undefined
              ? variables.data.city
              : (data.city ?? user?.city),
          location:
            variables.data.location !== undefined
              ? variables.data.location
              : (data.location ?? user?.location),
          avatar_url:
            variables.data.avatar_url !== undefined
              ? variables.data.avatar_url
              : (data.avatar_url ?? user?.avatar_url),
          banner_url:
            variables.data.banner_url !== undefined
              ? variables.data.banner_url
              : (data.banner_url ?? user?.banner_url),
        }
        setUser(merged)
        setIsEditing(false)
        setPasswordDialogOpen(false)
        resetPasswordForm()
        setSuccessMessage(t("profile.updatedMessage"))
      },
      onError: (error) => {
        setServerError(getErrorMessage(error, t("profile.updateFailed")))
      },
    },
  })

  if (!isAuthLoading && !user) {
    return <Navigate to="/login" replace />
  }

  if (!user) return null

  const enterEditMode = () => {
    setServerError(null)
    setPhotoError(null)
    setSuccessMessage(null)
    setAvatarPreview(user?.avatar_url ?? null)
    setBannerPreview(user?.banner_url ?? null)
    reset({
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      bio: user?.bio ?? "",
      contact_info: user?.contact_info ?? user?.contacts ?? "",
      location: user?.location ?? user?.city ?? "",
    })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setServerError(null)
    setPhotoError(null)
    setAvatarPreview(null)
    setBannerPreview(null)
    setIsEditing(false)
  }

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoError(null)

    const result = await validateAndProcessImage(file, MAX_AVATAR_BYTES, 512)
    if (!result.ok) {
      setPhotoError(t("validation.photoFormatSize"))
      event.target.value = ""
      return
    }
    setAvatarPreview(result.dataUrl)
  }

  const handleBannerFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoError(null)

    const result = await validateAndProcessImage(file, MAX_BANNER_BYTES, 1600)
    if (!result.ok) {
      setPhotoError(t("validation.bannerFormatSize"))
      event.target.value = ""
      return
    }
    setBannerPreview(result.dataUrl)
  }

  const handleUseGps = () => {
    if (!("geolocation" in navigator)) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4)
        const lon = position.coords.longitude.toFixed(4)
        setValue("location", `${lat}, ${lon}`, { shouldDirty: true })
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
      },
      { timeout: 8000 }
    )
  }

  const fieldError = (key?: string) => (key ? t(key) : undefined)
  const dash = t("profile.notProvided")

  const currentAvatar = isEditing
    ? (avatarPreview ?? user?.avatar_url)
    : user?.avatar_url
  const currentBanner = isEditing
    ? (bannerPreview ?? user?.banner_url)
    : user?.banner_url

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.email ||
    dash
  const initials = (
    `${user?.first_name?.trim()?.[0] ?? ""}${user?.last_name?.trim()?.[0] ?? ""}` ||
    user?.email?.[0] ||
    dash
  ).toUpperCase()

  const playerRating =
    user?.player_rating != null ? user.player_rating.toFixed(1) : dash
  const playerReviews = user?.player_reviews_count ?? dash
  const organizerRating =
    user?.organizer_rating != null ? user.organizer_rating.toFixed(1) : dash
  const organizerReviews = user?.organizer_reviews_count ?? dash

  const isBusy = updateProfileMutation.isPending

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-linear-to-r from-foreground/90 via-primary/40 to-foreground/85 sm:h-52 sm:rounded-b-2xl">
        {currentBanner && (
          <img
            src={currentBanner}
            alt=""
            className="size-full object-cover opacity-85"
          />
        )}

        {isEditing && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/25">
            <Input
              id={bannerInputId}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => void handleBannerFileChange(e)}
              className="sr-only"
              disabled={isBusy}
            />
            <Label
              htmlFor={bannerInputId}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-card/95 px-4 py-2 shadow-md backdrop-blur-xs transition-colors hover:bg-card"
            >
              <ImagePlus className="size-4 text-primary" aria-hidden="true" />
              <div className="text-left">
                <p className="text-xs font-semibold text-primary">
                  {t("profile.changeBanner")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("profile.bannerHint")}
                </p>
              </div>
            </Label>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="mx-auto -mt-20 max-w-3xl space-y-6 px-4 sm:px-6">
        {/* Profile Header Card */}
        <Card className="relative z-10 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar className="size-16 border-2 border-card shadow-xs sm:size-20">
                  {currentAvatar && (
                    <AvatarImage src={currentAvatar} alt={displayName} />
                  )}
                  <AvatarFallback className="text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {isEditing && (
                  <Label
                    htmlFor={avatarInputId}
                    aria-label={t("profile.changePhoto")}
                    className="absolute right-0 bottom-0 flex size-7 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
                  >
                    <Camera className="size-3.5" aria-hidden="true" />
                  </Label>
                )}
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {displayName}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {t("profile.memberSince", {
                    date: formatMemberSince(user?.created_at, dash),
                  })}
                </p>

                {isEditing && (
                  <div className="pt-0.5">
                    <Input
                      id={avatarInputId}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => void handleAvatarFileChange(e)}
                      className="sr-only"
                      disabled={isBusy}
                    />
                    <Label
                      htmlFor={avatarInputId}
                      className="cursor-pointer text-xs font-medium text-primary hover:underline"
                    >
                      {t("profile.changePhoto")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("profile.photoHint")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Read-only Ratings (SRS 3.2.3.3) */}
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="rounded-xl border border-border bg-background/60 px-4 py-2.5 text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("profile.playerRating")}
                </p>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <Star
                    className="size-4 fill-warning text-warning"
                    aria-hidden="true"
                  />
                  <span className="text-base font-bold text-foreground">
                    {playerRating}
                  </span>
                  {user?.player_rating != null && (
                    <span className="text-xs text-muted-foreground">
                      {t("profile.outOfFive")}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("profile.reviewsCount", { count: playerReviews })}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background/60 px-4 py-2.5 text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("profile.organizerRating")}
                </p>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <Shield
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
                  <span className="text-base font-bold text-foreground">
                    {organizerRating}
                  </span>
                  {user?.organizer_rating != null && (
                    <span className="text-xs text-muted-foreground">
                      {t("profile.outOfFive")}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("profile.reviewsCount", { count: organizerReviews })}
                </p>
              </div>
            </div>
          </div>

          {photoError && (
            <p
              role="alert"
              className="mt-3 flex items-center gap-1.5 text-xs text-destructive"
            >
              <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{photoError}</span>
            </p>
          )}
        </Card>

        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
          >
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          >
            <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

        {/* VIEW MODE (`My profile — View mode.png`) */}
        {!isEditing ? (
          <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                {t("profile.accountDetails")}
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={enterEditMode}
                className="h-8 rounded-lg px-4 text-xs font-medium text-primary"
              >
                {t("common.edit")}
              </Button>
            </div>

            <div className="mt-2 divide-y divide-border text-sm">
              <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
                <span className="text-muted-foreground">
                  {t("profile.firstName")}
                </span>
                <span className="font-medium text-foreground sm:col-span-2">
                  {user?.first_name || dash}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
                <span className="text-muted-foreground">
                  {t("profile.lastName")}
                </span>
                <span className="font-medium text-foreground sm:col-span-2">
                  {user?.last_name || dash}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
                <div>
                  <p className="text-muted-foreground">{t("profile.bio")}</p>
                  <p className="text-xs text-muted-foreground/70">
                    {t("common.optional")}
                  </p>
                </div>
                <span className="text-foreground sm:col-span-2">
                  {user?.bio || dash}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
                <div>
                  <p className="text-muted-foreground">
                    {t("profile.contactInfo")}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {t("common.optional")}
                  </p>
                </div>
                <span className="text-foreground sm:col-span-2">
                  {user?.contact_info ?? user?.contacts ?? dash}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:items-center sm:gap-4">
                <span className="text-muted-foreground">
                  {t("profile.email")}
                </span>
                <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                  <span className="text-foreground">{user?.email || dash}</span>
                  <Badge variant="muted" className="text-xs font-normal">
                    {t("common.readOnly")}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
                <span className="text-muted-foreground">
                  {t("profile.location")}
                </span>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-foreground">
                    {user?.location ?? user?.city ?? dash}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.locationHint")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-3 sm:items-center sm:gap-4">
                <span className="text-muted-foreground">
                  {t("profile.password")}
                </span>
                <div className="flex items-center justify-between gap-4 sm:col-span-2">
                  <span className="tracking-widest text-foreground">
                    {t("profile.passwordMasked")}
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setPasswordDialogOpen(true)}
                    className="h-auto p-0 text-xs font-medium text-primary"
                  >
                    {t("profile.changePassword")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          /* EDIT MODE (`My profile — Edit mode.png`) */
          <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                {t("profile.editProfile")}
              </h2>
              <span className="text-xs text-muted-foreground">
                {t("common.requiredFields")}
              </span>
            </div>

            <form
              noValidate
              className="mt-2 space-y-5"
              onSubmit={handleSubmit((values) => {
                setServerError(null)
                const cleanLocation = values.location?.trim() || null
                const cleanContact = values.contact_info?.trim() || null
                const cleanBio = values.bio?.trim() || null
                updateProfileMutation.mutate({
                  data: {
                    first_name: values.first_name.trim(),
                    last_name: values.last_name.trim(),
                    bio: cleanBio,
                    contact_info: cleanContact,
                    contacts: cleanContact,
                    city: cleanLocation,
                    location: cleanLocation,
                    avatar_url: avatarPreview ?? user?.avatar_url ?? null,
                    banner_url: bannerPreview ?? user?.banner_url ?? null,
                  },
                })
              })}
            >
              <FormField
                label={t("profile.firstName")}
                requiredIndicator
                autoComplete="given-name"
                placeholder={dash}
                error={fieldError(errors.first_name?.message)}
                disabled={isBusy}
                {...register("first_name")}
              />

              <FormField
                label={t("profile.lastName")}
                requiredIndicator
                autoComplete="family-name"
                placeholder={dash}
                error={fieldError(errors.last_name?.message)}
                disabled={isBusy}
                {...register("last_name")}
              />

              <div className="space-y-1.5">
                <Label htmlFor={bioInputId} className="text-sm font-medium text-foreground">
                  {t("profile.bio")}
                </Label>
                <Textarea
                  id={bioInputId}
                  maxLength={500}
                  placeholder={t("profile.bioPlaceholder")}
                  disabled={isBusy}
                  aria-invalid={errors.bio ? true : undefined}
                  {...register("bio")}
                />
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{t("profile.bioHint")}</span>
                  <span>
                    {t("profile.bioCounter", {
                      count: watchedBio.length,
                      max: 500,
                    })}
                  </span>
                </div>
              </div>

              <FormField
                label={t("profile.contactInfoEdit")}
                autoComplete="tel"
                placeholder={t("profile.contactPlaceholder")}
                error={fieldError(errors.contact_info?.message)}
                disabled={isBusy}
                {...register("contact_info")}
              />

              <FormField
                label={t("profile.email")}
                value={user?.email ?? ""}
                placeholder={dash}
                readOnly
                disabled
                startIcon={<Lock />}
                helperText={t("profile.emailLinkedNote")}
              />

              <FormField
                label={t("profile.location")}
                autoComplete="address-level2"
                placeholder={t("profile.locationPlaceholder")}
                startIcon={<MapPin />}
                helperText={t("profile.locationEditHint")}
                error={fieldError(errors.location?.message)}
                disabled={isBusy}
                endAdornment={
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleUseGps}
                    disabled={isBusy || isLocating}
                    className="h-6 rounded-md bg-muted px-2 text-xs font-medium text-primary hover:bg-muted/80"
                  >
                    {isLocating ? t("profile.gpsLocating") : t("profile.useGps")}
                  </Button>
                }
                {...register("location")}
              />

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  {t("profile.password")}
                </Label>
                <div className="flex items-center justify-between gap-4">
                  <span className="tracking-widest text-foreground">
                    {t("profile.passwordMasked")}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPasswordDialogOpen(true)}
                    disabled={isBusy}
                    className="h-8 rounded-lg px-3.5 text-xs font-medium text-primary"
                  >
                    {t("profile.changePassword")}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-end gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isBusy}
                  className="h-9 rounded-lg px-4 text-xs font-medium"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  isLoading={isBusy}
                  className="h-9 rounded-lg px-5 text-xs font-medium"
                >
                  {t("profile.saveChanges")}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onOpenChange={(open) => {
          setPasswordDialogOpen(open)
          if (!open) resetPasswordForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.passwordDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("profile.passwordDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <form
            noValidate
            className="space-y-4"
            onSubmit={handleSubmitPassword(({ password }) => {
              setServerError(null)
              updateProfileMutation.mutate({ data: { password } })
            })}
          >
            <FormField
              label={t("profile.passwordDialog.newPassword")}
              type="password"
              autoComplete="new-password"
              helperText={t("register.passwordHint")}
              error={fieldError(passwordErrors.password?.message)}
              disabled={isBusy}
              {...registerPassword("password")}
            />

            <FormField
              label={t("profile.passwordDialog.confirmPassword")}
              type="password"
              autoComplete="new-password"
              error={fieldError(passwordErrors.confirmPassword?.message)}
              disabled={isBusy}
              {...registerPassword("confirmPassword")}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
                disabled={isBusy}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" isLoading={isBusy}>
                {t("profile.passwordDialog.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

