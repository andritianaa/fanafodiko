import { createRoute } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "@/modules/identity/infrastructure/middlewares/AuthMiddleware";
import { JwtTokenService } from "@/modules/identity/infrastructure/security/JwtTokenService";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { ResendMailer } from "@/core/services/mailing/ResendMailer";
import { MongoPharmacyRequestRepository } from "../repositories/PharmacyRequestRepository";
import { SubmitPharmacyRequest } from "../../application/use-cases/SubmitPharmacyRequest";
import { CreatePharmacyRequestSchema } from "@ext/schemas";

const ctrl = createController();

const requestRepo = new MongoPharmacyRequestRepository();
const userRepo = new MongoUserRepository();
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me",
);
const mailer = new ResendMailer(process.env.RESEND_API_KEY || "re_xxxxxx");

ctrl.use("*", authMiddleware(tokenService, userRepo));

// POST /pharmacy-requests,soumission par un utilisateur
ctrl.openapi(
  createRoute({
    method: "post",
    path: "/",
    security: [{ AuthorizationApiKey: [] }],
    request: {
      body: {
        content: {
          "application/json": { schema: CreatePharmacyRequestSchema },
        },
      },
    },
    responses: {
      201: { description: "Demande soumise" },
    },
  }),
  async (c) => {
    const user = c.get("user");
    const input = c.req.valid("json");
    const useCase = new SubmitPharmacyRequest(requestRepo, userRepo, mailer);
    const result = await useCase.execute(user.id!, input);
    return c.json(result, 201);
  },
);

export default ctrl;
