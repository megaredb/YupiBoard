import { useTranslation } from "react-i18next"
import { useGoogleAuthApiV1AuthGooglePost } from "@/api/endpoints/auth/auth"
import type { TokenResponse } from "@/api/model"
import googleIcon from "@/assets/google.svg"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth"

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string; error?: string }) => void
          }) => void
          prompt: (
            momentListener?: (notification: {
              isNotDisplayed: () => boolean
              isSkippedMoment: () => boolean
              isDismissedMoment: () => boolean
              getDismissedReason?: () => string
            }) => void
          ) => void
        }
      }
    }
  }
}

interface GoogleAuthButtonProps {
  label: string
  disabled?: boolean
  className?: string
  onError: (message: string) => void
  onSuccess?: (response: TokenResponse) => void
}

export function GoogleAuthButton({
  label,
  disabled,
  className,
  onError,
  onSuccess,
}: GoogleAuthButtonProps) {
  const { t } = useTranslation()
  const setSession = useAuthStore((state) => state.setSession)

  const googleMutation = useGoogleAuthApiV1AuthGooglePost({
    mutation: {
      onSuccess: async (data) => {
        if (data.user.status === "Banned" || data.user.is_active === false) {
          onError(t("errors.accountBanned"))
          return
        }
        await setSession(data)
        onSuccess?.(data)
      },
      onError: (error) => {
        onError(getErrorMessage(error, t("errors.authFailed")))
      },
    },
  })

  const handleGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
    const googleId = window.google?.accounts?.id

    if (googleId && clientId) {
      googleId.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response.credential) {
            onError(t("errors.authCancelled"))
            return
          }
          googleMutation.mutate({ data: { id_token: response.credential } })
        },
      })
      googleId.prompt((notification) => {
        if (
          notification.isDismissedMoment() &&
          notification.getDismissedReason?.() !== "credential_returned"
        ) {
          onError(t("errors.authCancelled"))
        }
      })
      return
    }

    // Fallback when GIS SDK is not loaded in dev/test: send oauth token request to backend
    googleMutation.mutate({ data: { id_token: "google_oauth_token" } })
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || googleMutation.isPending}
      isLoading={googleMutation.isPending}
      onClick={handleGoogleClick}
      className={cn("h-10 w-full gap-2.5 text-sm font-medium", className)}
    >
      <img src={googleIcon} alt="" aria-hidden="true" className="size-4 shrink-0" />
      <span>{label}</span>
    </Button>
  )
}
