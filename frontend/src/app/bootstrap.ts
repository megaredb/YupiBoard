import type { QueryClient } from "@tanstack/react-query";
import i18next from "i18next";
import { readEnv } from "@/app/env";
import { createQueryClient } from "@/app/query-client";
import { createAppRouter } from "@/app/router";
import { configureApiClient, onSessionExpired } from "@/shared/api/client";
import { setRuntimeConfig } from "@/shared/config/runtime-config";
import { initI18n } from "@/shared/i18n/init-i18n";
import { showToast } from "@/shared/lib/toast/toast-store";
import { exitApp, onBackButton } from "@/shared/platform/back-button";
import { onDeepLink } from "@/shared/platform/deep-links";
import { initKeyboardInsets } from "@/shared/platform/keyboard";
import { initTheme } from "@/shared/platform/theme";
import { endSession, getCachedCurrentUser, sessionTokenStore } from "@/features/auth";

type AppRouter = ReturnType<typeof createAppRouter>;

function wireSession(router: AppRouter, queryClient: QueryClient): void {
  onSessionExpired(() => {
    const redirect = router.state.location.href;
    // A guest hitting a protected endpoint had no session to expire; just ask them to sign in.
    if (getCachedCurrentUser(queryClient))
      showToast(i18next.t("auth.session.expired"), { tone: "info" });
    // Drop the user before navigating: while it is still cached, the guest-only `/login` guard
    // would send the user straight back to the page that just failed.
    void endSession(queryClient).then(() =>
      router.navigate({ to: "/login", search: { redirect } }),
    );
  });
}

function wireNativeNavigation(router: AppRouter): void {
  onBackButton(() => {
    if (router.history.canGoBack()) router.history.back();
    else exitApp();
  });
  onDeepLink((href) => void router.navigate({ href }));
}

/** Everything that must happen once before the first render (ST-4). */
export async function bootstrap(): Promise<{ router: AppRouter; queryClient: QueryClient }> {
  const env = readEnv();
  setRuntimeConfig(env);
  configureApiClient({ baseURL: env.apiBaseUrl, tokenStore: sessionTokenStore });
  await initI18n();
  initTheme();
  initKeyboardInsets();

  const queryClient = createQueryClient();
  const router = createAppRouter(queryClient);
  wireSession(router, queryClient);
  wireNativeNavigation(router);
  return { router, queryClient };
}
