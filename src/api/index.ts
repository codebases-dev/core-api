import { auth } from "@/api/auth";
import { buildGraphqlServer } from "@/api/graphql";
import { Hono } from "@/lib/hono";

const app = new Hono();

app.route("/auth", auth);

app.use("/graphql", buildGraphqlServer);

export { app };
