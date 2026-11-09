import { createFileRoute } from "@tanstack/react-router";
import { citiesQueryOptions } from "@/features/locations";
import { CompleteProfilePage } from "@/features/profile/pages/complete-profile-page";

export const Route = createFileRoute("/_authenticated/profile/complete")({
  loader: ({ context }) =>
    context.queryClient.query({ ...citiesQueryOptions(), staleTime: "static" }),
  staticData: { layout: "standalone", titleKey: "profile.complete.title" },
  component: CompleteProfilePage,
});
