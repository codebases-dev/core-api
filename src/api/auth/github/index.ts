import { vValidator } from "@hono/valibot-validator";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";

import { AccessToken, RefreshToken, Session } from "@/api/auth/types";
import {
  createCsrfToken,
  createSessionId,
  isAllowedRedirectUri,
  setSessionInStore,
} from "@/api/auth/utils";
import { COOKIE_KEY } from "@/constants";
import { Context, Hono } from "@/lib/hono";

import { GitHubErrorResponse, GitHubTokenResponse } from "./types";
import { getUserFromGitHub as getUserFromGitHub, upsertUser } from "./user";

interface State {
  csrfToken?: string;
  redirectUri?: string;
}

function getCurrentUrl(c: Context) {
  const url = new URL(c.req.url);
  return `${url.origin}${url.pathname}`;
}

const github = new Hono();

github.get(
  "/login",
  vValidator(
    "query",
    v.pipe(
      v.object({ redirect_uri: v.optional(v.string()) }),
      v.transform((query) => ({
        redirectUri: query.redirect_uri,
      })),
    ),
  ),
  (c) => {
    const { redirectUri } = c.req.valid("query");

    const csrfToken = createCsrfToken();

    setCookie(c, "csrf_token", csrfToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 10,
      path: "/",
    });

    const state: State = {
      csrfToken,
      redirectUri,
    };

    const queryParams = new URLSearchParams({
      client_id: c.env.GITHUB_CLIENT_ID,
      redirect_uri: `${getCurrentUrl(c)}/callback`,
      state: JSON.stringify(state),
    });

    return c.redirect(
      `https://github.com/login/oauth/authorize?${queryParams.toString()}`,
    );
  },
);

github.get(
  "/login/callback",
  vValidator(
    "query",
    v.object({
      code: v.string(),
      state: v.pipe(
        v.string(),
        v.transform((state) => JSON.parse(state) as State),
      ),
    }),
    (result) => {
      if (!result.success) {
        throw new HTTPException(400);
      }
    },
  ),
  async (c) => {
    const { code, state } = c.req.valid("query");

    const storedCsrfToken = getCookie(c, "csrf_token");
    if (state.csrfToken !== storedCsrfToken) {
      throw new HTTPException(401);
    }

    const response = (await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        body: JSON.stringify({
          code,
          client_id: c.env.GITHUB_CLIENT_ID,
          client_secret: c.env.GITHUB_CLIENT_SECRET,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    ).then((res) => res.json())) as GitHubTokenResponse | GitHubErrorResponse;

    if ("error_description" in response) {
      throw new HTTPException(400, { message: response.error_description });
    }

    const accessToken: AccessToken = {
      token: response.access_token,
      expirationTime: Date.now() + response.expires_in * 1000,
    };

    const refreshToken: RefreshToken = {
      token: response.refresh_token,
      expirationTime: Date.now() + response.refresh_token_expires_in * 1000,
    };

    const githubUser = await getUserFromGitHub(accessToken);
    const user = await upsertUser(c, githubUser);

    const sessionId = createSessionId();

    setCookie(c, COOKIE_KEY.SESSION_ID, sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 10,
      path: "/",
    });

    const session: Session = {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl ?? undefined,
      },
      accessToken,
      refreshToken,
    };

    await setSessionInStore(c, sessionId, session, {
      expirationTtl: 60 * 10,
    }).catch((error: Error) => {
      throw new HTTPException(500, { message: error.message });
    });

    if (state.redirectUri && isAllowedRedirectUri(c, state.redirectUri)) {
      return c.redirect(state.redirectUri);
    }
    return c.json({ message: "Logged in" });
  },
);

export { github };
