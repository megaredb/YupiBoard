import axios from "axios";
import { z } from "zod";

const validationDetailSchema = z.array(
  z.object({
    loc: z.array(z.union([z.string(), z.number()])),
    msg: z.string(),
  }),
);

const errorBodySchema = z.object({
  detail: z.unknown().optional(),
  code: z.string().optional(),
});

/**
 * The only error shape the UI sees. `status` is `null` when no response arrived (offline,
 * timeout). `message` is kept for logging and must never be shown to users (ERR-2).
 */
export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string | null;
  readonly fieldErrors?: Record<string, string>;

  constructor(options: {
    status: number | null;
    code: string | null;
    message: string;
    fieldErrors?: Record<string, string>;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** The server rejected specific fields; forms show these next to the fields, not as a banner. */
export function hasFieldErrors(error: unknown): boolean {
  return isApiError(error) && Boolean(error.fieldErrors);
}

function parseFieldErrors(detail: unknown): Record<string, string> | undefined {
  const parsed = validationDetailSchema.safeParse(detail);
  if (!parsed.success || parsed.data.length === 0) return undefined;
  return Object.fromEntries(parsed.data.map((item) => [String(item.loc.at(-1)), item.msg]));
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;
  if (!axios.isAxiosError(error)) {
    return new ApiError({ status: null, code: null, message: String(error) });
  }
  const response = error.response;
  if (!response) {
    return new ApiError({ status: null, code: error.code ?? null, message: error.message });
  }
  const body = errorBodySchema.safeParse(response.data);
  const detail = body.success ? body.data.detail : undefined;
  return new ApiError({
    status: response.status,
    code: body.success ? (body.data.code ?? null) : null,
    message: typeof detail === "string" ? detail : error.message,
    fieldErrors: parseFieldErrors(detail),
  });
}
