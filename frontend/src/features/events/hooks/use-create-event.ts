import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createEventApiV1EventsPost,
  getListEventsApiV1EventsGetQueryKey,
  uploadEventImageApiV1EventsUploadImagePost,
} from "@/shared/api/generated/endpoints/events/events";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { prepareImage } from "@/shared/lib/image/prepare-image";
import { toEventCreate } from "@/features/events/lib/to-event-create";
import type { CreateEventFormValues } from "@/features/events/schemas/create-event.schema";

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
  const mutation = useMutation({
    mutationFn: async (values: CreateEventFormValues) => {
      const photoUrl = values.coverImage ? await uploadCover(values.coverImage) : null;
      return createEventApiV1EventsPost(toEventCreate(values, photoUrl));
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: getListEventsApiV1EventsGetQueryKey() }),
  });

  return {
    createEvent: mutation.mutate,
    isPending: mutation.isPending,
    isCreated: mutation.isSuccess,
    errorKey: mutation.isError ? getApiErrorKey(mutation.error, "events.create.failed") : null,
  };
}
