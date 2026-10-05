import { verifyUser } from "./_lib/auth.js";
import { getUsage } from "./_lib/usage.js";

// GET /api/usage → { used, limit } for the signed-in user
export default {
  async fetch(request: Request) {
    if (request.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    let uid: string | null;
    try {
      uid = await verifyUser(request.headers.get("authorization"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server configuration error.";
      return Response.json({ error: message }, { status: 500 });
    }
    if (!uid) {
      return Response.json({ error: "Please sign in with Google to use ReSite." }, { status: 401 });
    }

    try {
      return Response.json(await getUsage(uid));
    } catch (error) {
      console.error("Usage database error", error);
      return Response.json({ error: "The usage service is unavailable." }, { status: 503 });
    }
  },
};