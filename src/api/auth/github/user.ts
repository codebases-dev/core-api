import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

import { AccessToken } from "@/api/auth/types";
import { createRandomId } from "@/api/auth/utils";
import { githubUser, user as userTable } from "@/db/schema";
import { getDb } from "@/lib/drizzle";
import { Context } from "@/lib/hono";

import { GitHubErrorResponse, GitHubUser } from "./types";

export async function getUserFromGitHub(
  accessToken: AccessToken,
): Promise<GitHubUser> {
  const response = (await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Codebases-API",
    },
  }).then((res) => res.json())) as GitHubUser | GitHubErrorResponse;

  if ("message" in response) {
    throw new HTTPException(400, { message: response.message });
  }

  return response;
}

async function getUserId(
  c: Context,
  githubId: number,
): Promise<string | undefined> {
  const db = getDb(c);

  const [result] = await db
    .select({ userId: githubUser.userId })
    .from(githubUser)
    .where(eq(githubUser.githubId, githubId));

  return result?.userId;
}

async function registerUser(c: Context, user: GitHubUser) {
  const db = getDb(c);
  const userId = createRandomId();

  const [[result]] = await db.batch([
    db
      .insert(userTable)
      .values({
        id: userId,
        username: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
      })
      .returning(),
    db.insert(githubUser).values({
      userId: userId,
      githubId: user.id,
    }),
  ]);

  return result;
}

async function updateUser(c: Context, userId: string, user: GitHubUser) {
  const db = getDb(c);

  const [result] = await db
    .update(userTable)
    .set({
      username: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
    })
    .where(eq(userTable.id, userId))
    .returning();

  return result;
}

export async function upsertUser(c: Context, user: GitHubUser) {
  const userId = await getUserId(c, user.id);
  if (userId) {
    return updateUser(c, userId, user);
  }
  return registerUser(c, user);
}
