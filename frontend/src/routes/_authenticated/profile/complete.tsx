import { createFileRoute } from "@tanstack/react-router";
import { loadQuery } from "@/shared/api/load-query";
import { citiesQueryOptions } from "@/features/locations";
import { CompleteProfilePage } from "@/features/profile/pages/complete-profile-page";

export const Route = createFileRoute("/_authenticated/profile/complete")({
  loader: ({ context }) => loadQuery(context.queryClient, citiesQueryOptions()),
  staticData: { layout: "standalone", titleKey: "profile.complete.title" },
  component: CompleteProfilePage,
});
