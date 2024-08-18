import { drizzle } from "drizzle-orm/d1";

import { Context } from "@/lib/hono";

export function getDb(c: Context) {
  return drizzle(c.env.DB);
}
