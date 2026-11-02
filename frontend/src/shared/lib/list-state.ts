export type ListState<T> =
  | { status: "pending" }
  | { status: "error"; retry: () => void }
  | { status: "success"; items: T[] };

interface ListQuery {
  isPending: boolean;
  isError: boolean;
  refetch: () => unknown;
}

/** Collapses a query's flags into the one state a list renders (TS-6). */
export function toListState<T>(query: ListQuery, items: T[] | undefined): ListState<T> {
  if (query.isError) return { status: "error", retry: () => void query.refetch() };
  if (query.isPending || !items) return { status: "pending" };
  return { status: "success", items };
}
