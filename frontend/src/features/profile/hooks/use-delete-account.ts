import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useDeleteCurrentUserApiV1UsersMeDelete } from "@/shared/api/generated/endpoints/users/users";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import { showToast } from "@/shared/lib/toast/toast-store";
import { endSession } from "@/features/auth";

interface DeleteAccount {
  deleteAccount: () => void;
  isPending: boolean;
}

export function useDeleteAccount(): DeleteAccount {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const mutation = useDeleteCurrentUserApiV1UsersMeDelete({
    mutation: {
      onSuccess: async () => {
        await endSession(queryClient);
        showToast(t("profile.deleteAccount.deleted"));
        await navigate({ to: "/events" });
      },
      onError: (error) =>
        showToast(
          t(
            // 409: the backend refuses while the user still organizes upcoming events.
            getApiErrorKey(error, "profile.deleteAccount.failed", {
              409: "profile.deleteAccount.hasActiveEvents",
            }),
          ),
          { tone: "error" },
        ),
    },
  });

  return { deleteAccount: () => mutation.mutate(), isPending: mutation.isPending };
}
