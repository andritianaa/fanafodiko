import { createRoute } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "../middlewares/AuthMiddleware";
import { adminMiddleware } from "../middlewares/AdminMiddleware";
import { MongoUserRepository } from "../repositories/UserRepository";
import { JwtTokenService } from "../security/JwtTokenService";
import { GetAllUsers } from "../../application/use-cases/GetAllUsers";
import { BackofficeUsersResponseSchema } from "@ext/schemas";

const backofficeController = createController();

const userRepository = new MongoUserRepository();
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me"
);

backofficeController.use(
  "*",
  authMiddleware(tokenService, userRepository)
);
backofficeController.use("*", adminMiddleware);

const listUsersRoute = createRoute({
  method: "get",
  path: "/users",
  security: [{ AuthorizationApiKey: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: BackofficeUsersResponseSchema } },
      description: "Liste de tous les utilisateurs",
    },
    403: { description: "Accès refusé" },
  },
});

backofficeController.openapi(listUsersRoute, async (c) => {
  const useCase = new GetAllUsers(userRepository);
  const users = await useCase.execute();
  return c.json({ users, total: users.length }, 200);
});

export default backofficeController;
