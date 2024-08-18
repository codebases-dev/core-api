import {
  Context as BaseContext,
  Hono as BaseHono,
  MiddlewareHandler as BaseMiddlewareHandler,
} from "hono";

interface Env {
  Bindings: {
    ENVIRONMENT: "dev" | "production";
    DB: D1Database;
    SESSION_STORE: KVNamespace<string>;
    ALLOWED_LOGIN_REDIRECT_URIS: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
  };
}

export type Context = BaseContext<Env>;

export type MiddlewareHandler = BaseMiddlewareHandler<Env>;

export const Hono = BaseHono<Env>;
