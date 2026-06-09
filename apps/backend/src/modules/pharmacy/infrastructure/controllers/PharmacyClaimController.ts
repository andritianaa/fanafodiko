import { createRoute } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "@/modules/identity/infrastructure/middlewares/AuthMiddleware";
import { JwtTokenService } from "@/modules/identity/infrastructure/security/JwtTokenService";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { ResendMailer } from "@/core/services/mailing/ResendMailer";
import { MongoPharmacyRepository } from "../repositories/PharmacyRepository";
import { MongoPharmacyClaimRepository } from "../repositories/PharmacyClaimRepository";
import { SubmitPharmacyClaim } from "../../application/use-cases/SubmitPharmacyClaim";
import { CreatePharmacyClaimSchema } from "@ext/schemas";

const ctrl = createController();

const claimRepo = new MongoPharmacyClaimRepository();
const pharmacyRepo = new MongoPharmacyRepository();
const userRepo = new MongoUserRepository();
const tokenService = new JwtTokenService(process.env.JWT_SECRET || "supersecret-change-me");
const mailer = new ResendMailer(process.env.RESEND_API_KEY || "re_xxxxxx");

ctrl.use("*", authMiddleware(tokenService, userRepo));

// POST /pharmacy-claims
ctrl.openapi(
  createRoute({
    method: "post",
    path: "/",
    security: [{ AuthorizationApiKey: [] }],
    request: {
      body: {
        content: { "application/json": { schema: CreatePharmacyClaimSchema } },
      },
    },
    responses: {
      201: { description: "Réclamation soumise" },
    },
  }),
  async (c) => {
    const user = c.get("user");
    const input = c.req.valid("json");
    const useCase = new SubmitPharmacyClaim(claimRepo, pharmacyRepo, userRepo, mailer);
    const result = await useCase.execute(user.id!, input);
    return c.json(result, 201);
  },
);

export default ctrl;
