import { graphqlServer } from "@hono/graphql-server";
import SchemaBuilder from "@pothos/core";
import { HTTPException } from "hono/http-exception";

import { getSession } from "@/api/auth/utils";
import { Context, MiddlewareHandler } from "@/lib/hono";

interface User {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
}

function buildSchema(c: Context) {
  const builder = new SchemaBuilder<{
    Objects: {
      User: User;
    };
  }>({});

  builder.objectType("User", {
    fields: (t) => ({
      id: t.exposeString("id"),
      username: t.exposeString("username"),
      name: t.exposeString("name"),
      avatarUrl: t.exposeString("avatarUrl"),
    }),
  });

  builder.queryType({
    fields: (t) => ({
      viewer: t.field({
        type: "User",
        resolve: async () => {
          const session = await getSession(c);
          if (!session) {
            throw new HTTPException(401);
          }
          return session.user;
        },
      }),
    }),
  });

  return builder.toSchema();
}

export const buildGraphqlServer: MiddlewareHandler = async (c, next) => {
  return graphqlServer({
    schema: buildSchema(c),
    graphiql: c.env.ENVIRONMENT !== "production",
  })(c, next);
};
