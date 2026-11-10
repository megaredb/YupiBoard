import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createEventApiV1EventsPost,
  getListEventsApiV1EventsGetQueryKey,
  getListMyCreatedEventsApiV1EventsMyCreatedGetQueryKey,
  uploadEventImageApiV1EventsUploadImagePost,
} from "@/shared/api/generated/endpoints/events/events";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { prepareImage } from "@/shared/lib/image/prepare-image";
import { toEventCreate } from "@/features/events/lib/to-event-create";
import type { CreateEventFormValues } from "@/features/events/schemas/create-event.schema";
import { findCityByName, useCities } from "@/features/locations";

interface UseCreateEventResult {
  createEvent: (values: CreateEventFormValues) => void;
  isPending: boolean;
  isCreated: boolean;
  errorKey: TranslationKey | null;
}

async function uploadCover(file: File): Promise<string> {
  const prepared = await prepareImage(file, "cover");
  if (prepared.status !== "ok") throw new Error(`Cover rejected: ${prepared.status}`);
  const { image_url } = await uploadEventImageApiV1EventsUploadImagePost({ file: prepared.file });
  return image_url;
}

export function useCreateEvent(): UseCreateEventResult {
  const queryClient = useQueryClient();
  const cities = useCities();
  const mutation = useMutation({
    mutationFn: async (values: CreateEventFormValues) => {
      const city = findCityByName(cities, values.city);
      if (!city) throw new Error("No supported city to place the event in");
      const photoUrl = values.coverImage ? await uploadCover(values.coverImage) : null;
      return createEventApiV1EventsPost(toEventCreate(values, city, photoUrl));
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: getListEventsApiV1EventsGetQueryKey() }),
        queryClient.invalidateQueries({
          queryKey: getListMyCreatedEventsApiV1EventsMyCreatedGetQueryKey(),
        }),
      ]),
  });

  return {
    createEvent: mutation.mutate,
    isPending: mutation.isPending,
    isCreated: mutation.isSuccess,
    errorKey: mutation.isError
      ? getApiErrorKey(mutation.error, "events.create.failed", {
          403: "events.create.verifyEmailFirst",
        })
      : null,
  };
}
