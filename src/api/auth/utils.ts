import { getCookie } from "hono/cookie";

import { COOKIE_KEY } from "@/constants";
import { Context } from "@/lib/hono";

import { Session } from "./types";

export function createCsrfToken() {
  return crypto.randomUUID();
}

export function createSessionId() {
  return crypto.randomUUID();
}

export function createRandomId() {
  return crypto.randomUUID();
}

function getAllowedLoginRedirectUris(c: Context) {
  return c.env.ALLOWED_LOGIN_REDIRECT_URIS.split(",");
}

export function isAllowedRedirectUri(c: Context, uri: string) {
  return getAllowedLoginRedirectUris(c).some((allowedUri) =>
    uri.startsWith(allowedUri),
  );
}

export async function getSessionFromStore(c: Context, sessionId: string) {
  return c.env.SESSION_STORE.get(sessionId).then((value) =>
    value ? (JSON.parse(value) as Session) : undefined,
  );
}

export async function setSessionInStore(
  c: Context,
  sessionId: string,
  session: Session,
  options?: KVNamespacePutOptions,
) {
  return c.env.SESSION_STORE.put(sessionId, JSON.stringify(session), options);
}

export async function deleteSessionFromStore(c: Context, sessionId: string) {
  return c.env.SESSION_STORE.delete(sessionId);
}

export async function getSession(c: Context): Promise<Session | undefined> {
  const sessionId = getCookie(c, COOKIE_KEY.SESSION_ID);
  if (!sessionId) {
    return undefined;
  }
  return getSessionFromStore(c, sessionId);
}
