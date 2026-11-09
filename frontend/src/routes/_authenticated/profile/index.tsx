import { createFileRoute } from "@tanstack/react-router";
import { loadQuery } from "@/shared/api/load-query";
import { citiesQueryOptions } from "@/features/locations";
import { ProfilePage } from "@/features/profile/pages/profile-page";

export const Route = createFileRoute("/_authenticated/profile/")({
  loader: ({ context }) => loadQuery(context.queryClient, citiesQueryOptions()),
  staticData: { titleKey: "profile.pageTitle" },
  component: ProfilePage,
});
