import { createFileRoute } from "@tanstack/react-router";
import { ensureProfileBio } from "@/features/profile";
import { ProfilePage } from "@/features/profile/pages/profile-page";

export const Route = createFileRoute("/_authenticated/profile/")({
  loader: ({ context }) => ensureProfileBio(context.queryClient),
  staticData: { titleKey: "profile.pageTitle" },
  component: ProfilePage,
});
