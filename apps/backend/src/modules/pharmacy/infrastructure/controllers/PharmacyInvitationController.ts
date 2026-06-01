import { createRoute, z } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "@/modules/identity/infrastructure/middlewares/AuthMiddleware";
import { JwtTokenService } from "@/modules/identity/infrastructure/security/JwtTokenService";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { MongoPharmacyRepository } from "../repositories/PharmacyRepository";
import { MongoPharmacyMembershipRepository } from "../repositories/PharmacyMembershipRepository";
import { MongoPharmacyInvitationRepository } from "../repositories/PharmacyInvitationRepository";
import { AcceptInvitation } from "../../application/use-cases/AcceptInvitation";
import { AppError } from "@/core/errors/AppError";
import { PharmacyInvitationSchema } from "@ext/schemas";

const ctrl = createController();

const pharmacyRepo = new MongoPharmacyRepository();
const membershipRepo = new MongoPharmacyMembershipRepository();
const invitationRepo = new MongoPharmacyInvitationRepository();
const userRepo = new MongoUserRepository();
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me",
);

// GET /pharmacy-invitations/:token  (public,affiche les détails)
ctrl.openapi(
  createRoute({
    method: "get",
    path: "/:token",
    request: { params: z.object({ token: z.string() }) },
    responses: {
      200: {
        content: { "application/json": { schema: PharmacyInvitationSchema } },
        description: "Détails de l'invitation",
      },
      404: { description: "Invitation introuvable" },
    },
  }),
  async (c) => {
    const { token } = c.req.valid("param");
    const invitation = await invitationRepo.findByToken(token);
    if (!invitation)
      throw new AppError("Invitation introuvable", 404, "NOT_FOUND");

    const pharmacy = await pharmacyRepo.findById(invitation.pharmacyId);
    const status = invitation.isValid()
      ? "pending"
      : invitation.props.status === "accepted"
        ? "accepted"
        : "expired";

    return c.json(
      {
        token: invitation.token,
        pharmacyId: invitation.pharmacyId,
        pharmacyName: pharmacy?.props.name ?? "(pharmacie supprimée)",
        email: invitation.email,
        role: invitation.role,
        status,
        expiresAt: invitation.props.expiresAt.toISOString(),
      },
      200,
    );
  },
);

// POST /pharmacy-invitations/:token/accept  (auth requise)
ctrl.use("/:token/accept", authMiddleware(tokenService, userRepo));
ctrl.openapi(
  createRoute({
    method: "post",
    path: "/:token/accept",
    security: [{ AuthorizationApiKey: [] }],
    request: { params: z.object({ token: z.string() }) },
    responses: {
      200: { description: "Invitation acceptée" },
      403: { description: "Email ne correspond pas" },
      410: { description: "Invitation expirée" },
    },
  }),
  async (c) => {
    const { token } = c.req.valid("param");
    const user = c.get("user");
    const result = await new AcceptInvitation(
      invitationRepo,
      membershipRepo,
      userRepo,
    ).execute(token, user.id!);
    return c.json({ message: "Invitation acceptée", ...result }, 200);
  },
);

export default ctrl;
