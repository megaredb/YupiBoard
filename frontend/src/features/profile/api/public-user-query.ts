import { queryOptions } from "@tanstack/react-query"
import {
  getGetUserApiV1UsersUserIdGetQueryKey,
  getUserApiV1UsersUserIdGet,
} from "@/shared/api/generated/endpoints/users/users"

/** Built from the generated key and fetcher so it also works with `useSuspenseQuery`. */
export function publicUserQueryOptions(userId: string) {
  return queryOptions({
    queryKey: getGetUserApiV1UsersUserIdGetQueryKey(userId),
    queryFn: ({ signal }) => getUserApiV1UsersUserIdGet(userId, undefined, signal),
  })
}
