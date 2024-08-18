import { relations } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
});

export const githubUser = sqliteTable(
  "github_user",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id),
    githubId: integer("github_id").unique().notNull(),
  },
  (table) => {
    return {
      githubIdIndex: uniqueIndex("github_id_index").on(table.githubId),
    };
  },
);

export const userRelations = relations(user, ({ one }) => ({
  githubUser: one(githubUser, {
    fields: [user.id],
    references: [githubUser.userId],
  }),
}));
