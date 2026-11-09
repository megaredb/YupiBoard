import { createFileRoute } from "@tanstack/react-router";
import { citiesQueryOptions } from "@/features/locations";
import { ProfilePage } from "@/features/profile/pages/profile-page";

export const Route = createFileRoute("/_authenticated/profile/")({
  loader: ({ context }) =>
    context.queryClient.query({ ...citiesQueryOptions(), staleTime: "static" }),
  staticData: { titleKey: "profile.pageTitle" },
  component: ProfilePage,
});
