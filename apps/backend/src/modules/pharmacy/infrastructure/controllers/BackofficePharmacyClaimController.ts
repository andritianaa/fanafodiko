import { createRoute, z } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "@/modules/identity/infrastructure/middlewares/AuthMiddleware";
import { adminMiddleware } from "@/modules/identity/infrastructure/middlewares/AdminMiddleware";
import { JwtTokenService } from "@/modules/identity/infrastructure/security/JwtTokenService";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { ResendMailer } from "@/core/services/mailing/ResendMailer";
import { MongoPharmacyClaimRepository } from "../repositories/PharmacyClaimRepository";
import { MongoPharmacyMembershipRepository } from "../repositories/PharmacyMembershipRepository";
import {
  ListPharmacyClaims,
  ApprovePharmacyClaim,
  RejectPharmacyClaim,
} from "../../application/use-cases/ReviewPharmacyClaim";
import { PharmacyClaimsResponseSchema, ReviewPharmacyClaimSchema } from "@ext/schemas";

const ctrl = createController();

const claimRepo = new MongoPharmacyClaimRepository();
const membershipRepo = new MongoPharmacyMembershipRepository();
const userRepo = new MongoUserRepository();
const tokenService = new JwtTokenService(process.env.JWT_SECRET || "supersecret-change-me");
const mailer = new ResendMailer(process.env.RESEND_API_KEY || "re_xxxxxx");

ctrl.use("*", authMiddleware(tokenService, userRepo));
ctrl.use("*", adminMiddleware);

// GET /backoffice/pharmacy-claims
ctrl.openapi(
  createRoute({
    method: "get",
    path: "/",
    security: [{ AuthorizationApiKey: [] }],
    responses: {
      200: {
        content: { "application/json": { schema: PharmacyClaimsResponseSchema } },
        description: "Toutes les réclamations",
      },
    },
  }),
  async (c) => {
    const { claims, total } = await new ListPharmacyClaims(claimRepo).execute();
    const data = claims.map((cl) => ({
      id: cl.id!,
      pharmacyId: cl.pharmacyId,
      pharmacyName: cl.pharmacyName,
      submittedByEmail: cl.submittedByEmail,
      contactInfo: cl.contactInfo,
      proofImages: cl.proofImages,
      status: cl.status,
      rejectionReason: cl.rejectionReason,
      createdAt: cl.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
    return c.json({ claims: data, total }, 200);
  },
);

// POST /backoffice/pharmacy-claims/:claimId/approve
ctrl.openapi(
  createRoute({
    method: "post",
    path: "/:claimId/approve",
    security: [{ AuthorizationApiKey: [] }],
    request: { params: z.object({ claimId: z.string() }) },
    responses: { 200: { description: "Réclamation approuvée" } },
  }),
  async (c) => {
    const { claimId } = c.req.valid("param");
    await new ApprovePharmacyClaim(claimRepo, membershipRepo, mailer).execute(claimId);
    return c.json({ message: "Réclamation approuvée" }, 200);
  },
);

// POST /backoffice/pharmacy-claims/:claimId/reject
ctrl.openapi(
  createRoute({
    method: "post",
    path: "/:claimId/reject",
    security: [{ AuthorizationApiKey: [] }],
    request: {
      params: z.object({ claimId: z.string() }),
      body: {
        content: { "application/json": { schema: ReviewPharmacyClaimSchema } },
      },
    },
    responses: { 200: { description: "Réclamation refusée" } },
  }),
  async (c) => {
    const { claimId } = c.req.valid("param");
    const { reason } = c.req.valid("json");
    await new RejectPharmacyClaim(claimRepo, mailer).execute(claimId, reason);
    return c.json({ message: "Réclamation refusée" }, 200);
  },
);

export default ctrl;
