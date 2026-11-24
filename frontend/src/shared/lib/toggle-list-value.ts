/** Returns a copy of `list` with `value` added or removed. */
export function toggleListValue<T>(list: readonly T[], value: T, isIncluded: boolean): T[] {
  const rest = list.filter((item) => item !== value);
  return isIncluded ? [...rest, value] : rest;
}
