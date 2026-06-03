import { createRoute, z } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "@/modules/identity/infrastructure/middlewares/AuthMiddleware";
import { JwtTokenService } from "@/modules/identity/infrastructure/security/JwtTokenService";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { BugReportModel } from "../models/BugReportModel";
import { CreateBugReportSchema } from "@ext/schemas";

const bugReportController = createController();

const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me",
);
const userRepository = new MongoUserRepository();

bugReportController.use("*", authMiddleware(tokenService, userRepository));

// POST /bug-reports, soumettre un signalement
const createRoute_ = createRoute({
  method: "post",
  path: "/",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateBugReportSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: z.object({ id: z.string() }) },
      },
      description: "Signalement créé",
    },
  },
});

bugReportController.openapi(createRoute_, async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  const report = await BugReportModel.create({
    userId: user.id,
    userEmail: user.email.getValue(),
    description: body.description,
    screenshots: body.screenshots ?? [],
    deviceInfo: body.deviceInfo,
    status: "open",
  });

  return c.json({ id: String(report._id) }, 201);
});

export default bugReportController;
