// INTERIM: the backend must offer a way to check a reset token without spending it (e.g.
// `GET /auth/reset-password/validate?token=`). Until then only what the token itself says is
// checked (its shape, type and expiry); a token that was already used, or replaced by a newer
// link, is only caught when the form is submitted.
import { z } from "zod";
import type { TranslationKey } from "@/shared/i18n/translation-key";

export type ResetTokenState = "missing" | "invalid" | "expired" | "usable";

const MS_PER_SECOND = 1000;

// Claims set by the backend's `create_action_token(action="reset_password")`.
const resetTokenPayloadSchema = z.object({
  type: z.literal("reset_password"),
  exp: z.number(),
});

function readJwtPayload(token: string): unknown {
  const payload = token.split(".")[1];
  if (!payload) return null;
  const base64 = payload.replaceAll("-", "+").replaceAll("_", "/");
  try {
    const json: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    return json;
  } catch {
    // Not base64 or not JSON: the link was cut short or edited.
    return null;
  }
}

export function inspectResetToken(token: string | undefined, now = Date.now()): ResetTokenState {
  if (!token) return "missing";
  const payload = resetTokenPayloadSchema.safeParse(readJwtPayload(token));
  if (!payload.success) return "invalid";
  return payload.data.exp * MS_PER_SECOND <= now ? "expired" : "usable";
}

const TOKEN_FAILURE_KEYS = {
  missing: "auth.resetPassword.missingToken",
  invalid: "auth.resetPassword.invalidToken",
  expired: "auth.resetPassword.expiredToken",
} as const satisfies Record<Exclude<ResetTokenState, "usable">, TranslationKey>;

export function getResetFailureKey(
  tokenState: ResetTokenState,
  isRejectedByServer: boolean,
): TranslationKey | null {
  if (tokenState !== "usable") return TOKEN_FAILURE_KEYS[tokenState];
  return isRejectedByServer ? "auth.resetPassword.usedToken" : null;
}
