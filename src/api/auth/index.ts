import { deleteCookie, getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";

import { COOKIE_KEY } from "@/constants";
import { Hono } from "@/lib/hono";

import { github } from "./github";
import { deleteSessionFromStore } from "./utils";

const auth = new Hono();

auth.route("/oauth2/github", github);

auth.get("/logout", async (c) => {
  const sessionId = getCookie(c, COOKIE_KEY.SESSION_ID);
  if (sessionId) {
    await deleteSessionFromStore(c, sessionId).catch((error: Error) => {
      throw new HTTPException(500, { message: error.message });
    });
    deleteCookie(c, COOKIE_KEY.SESSION_ID);
  }

  return c.json({ message: "Logged out" });
});

export { auth };
