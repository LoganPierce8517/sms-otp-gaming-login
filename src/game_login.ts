import { z } from "zod";
import { infrai, InfraiError } from "./infrai.js";

export const LoginBody = z.object({ phone: z.string().min(7), code: z.string().regex(/^\d{4,8}$/) });
export type PlayerAsset = { id: string; kind: "skin" | "badge"; ownerId: string };
export type LiveEvent = { id: string; title: string; startsAt: string };
export type ModerationItem = { id: string; reason: string; status: "queued" | "reviewed" };
export type LoginResult = { session: unknown; player: { phone: string; assets: PlayerAsset[]; events: LiveEvent[]; moderation: ModerationItem[] } };

export async function verifyGameLogin(input: unknown): Promise<LoginResult> {
  const body = LoginBody.parse(input);
  const verified = await infrai.auth.phone.verify({ phone: body.phone, code: body.code, login: true }) as { user_id?: string };
  if (!verified.user_id) throw new Error("verification did not return a user_id");
  const session = await infrai.auth.session.create({ user_id: verified.user_id, method: "phone", require_mfa: false });
  return { session, player: { phone: body.phone, assets: [], events: [], moderation: [] } };
}

export function clientStatus(error: unknown): number {
  return error instanceof InfraiError && error.status >= 400 && error.status < 500 ? error.status : 500;
}
