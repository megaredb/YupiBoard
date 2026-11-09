import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";

export function useGoBack(): () => void {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const navigate = useNavigate();

  return () => {
    if (canGoBack) router.history.back();
    else void navigate({ to: "/events" });
  };
}
