import { createRoute, z } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "@/modules/identity/infrastructure/middlewares/AuthMiddleware";
import { JwtTokenService } from "@/modules/identity/infrastructure/security/JwtTokenService";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { ResendMailer } from "@/core/services/mailing/ResendMailer";
import { MongoPharmacyRepository } from "../repositories/PharmacyRepository";
import { MongoPharmacyMembershipRepository } from "../repositories/PharmacyMembershipRepository";
import { MongoPharmacyInvitationRepository } from "../repositories/PharmacyInvitationRepository";
import { requirePharmacyRole } from "../middlewares/PharmacyRoleMiddleware";
import { serializePharmacy } from "../serializers/pharmacySerializer";
import {
  GetMyPharmacies,
  UpdatePharmacyInfo,
  UpdatePharmacyHours,
  UpdatePharmacyImages,
} from "../../application/use-cases/ManagePharmacy";
import {
  ListMembers,
  UpdateMemberRole,
  RemoveMember,
} from "../../application/use-cases/ManageMembers";
import { InviteMember } from "../../application/use-cases/InviteMember";
import {
  AddExceptionalSchedule,
  UpdateExceptionalSchedule,
  DeleteExceptionalSchedule,
  AddPharmacyGuard,
  UpdatePharmacyGuard,
  DeletePharmacyGuard,
} from "../../application/use-cases/ManageExceptional";
import { AppError } from "@/core/errors/AppError";
import {
  MyPharmaciesResponseSchema,
  PharmacyMembersResponseSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  UpdatePharmacyInfoSchema,
  UpdatePharmacyHoursSchema,
  PharmacyListResponseSchema,
  CreateExceptionalScheduleSchema,
  UpdateExceptionalScheduleSchema,
  CreatePharmacyGuardSchema,
  UpdatePharmacyGuardSchema,
} from "@ext/schemas";

const ctrl = createController();

const pharmacyRepo = new MongoPharmacyRepository();
const membershipRepo = new MongoPharmacyMembershipRepository();
const invitationRepo = new MongoPharmacyInvitationRepository();
const userRepo = new MongoUserRepository();
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me"
);
const mailer = new ResendMailer(process.env.RESEND_API_KEY || "re_xxxxxx");

// Auth obligatoire sur toutes les routes
ctrl.use("*", authMiddleware(tokenService, userRepo));

// Middlewares de rôle pharmacie (montés avant les handlers)
ctrl.use("/:id", requirePharmacyRole(membershipRepo, "staff"));
ctrl.use("/:id/info", requirePharmacyRole(membershipRepo, "admin"));
ctrl.use("/:id/hours", requirePharmacyRole(membershipRepo, "staff"));
ctrl.use("/:id/images", requirePharmacyRole(membershipRepo, "staff"));
ctrl.use("/:id/members", requirePharmacyRole(membershipRepo, "staff"));
ctrl.use("/:id/invitations", requirePharmacyRole(membershipRepo, "admin"));
ctrl.use("/:id/members/:userId", requirePharmacyRole(membershipRepo, "admin"));
ctrl.use("/:id/members/:userId/role", requirePharmacyRole(membershipRepo, "superadmin"));
ctrl.use("/:id/exceptional", requirePharmacyRole(membershipRepo, "staff"));
ctrl.use("/:id/exceptional/:scheduleId", requirePharmacyRole(membershipRepo, "staff"));
ctrl.use("/:id/guards", requirePharmacyRole(membershipRepo, "admin"));
ctrl.use("/:id/guards/:guardId", requirePharmacyRole(membershipRepo, "admin"));

const sec = [{ AuthorizationApiKey: [] }];

// GET /my/pharmacies
ctrl.openapi(
  createRoute({
    method: "get",
    path: "/",
    security: sec,
    responses: {
      200: {
        content: { "application/json": { schema: MyPharmaciesResponseSchema } },
        description: "Pharmacies gérées par l'utilisateur",
      },
    },
  }),
  async (c) => {
    const user = c.get("user");
    const useCase = new GetMyPharmacies(membershipRepo, pharmacyRepo);
    const pharmacies = await useCase.execute(user.id!);
    return c.json({ pharmacies }, 200);
  }
);

// GET /my/pharmacies/:id  (détail gestion)
ctrl.openapi(
  createRoute({
    method: "get",
    path: "/:id",
    security: sec,
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        content: { "application/json": { schema: PharmacyListResponseSchema.shape.pharmacies.element } },
        description: "Détail de la pharmacie",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const pharmacy = await pharmacyRepo.findById(id);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");
    const membership = c.get("pharmacyMembership");
    return c.json({ ...serializePharmacy(pharmacy), myRole: membership?.role }, 200);
  }
);

// PATCH /my/pharmacies/:id/info  (admin+)
ctrl.openapi(
  createRoute({
    method: "patch",
    path: "/:id/info",
    security: sec,
    request: {
      params: z.object({ id: z.string() }),
      body: { content: { "application/json": { schema: UpdatePharmacyInfoSchema } } },
    },
    responses: { 200: { description: "Infos mises à jour" } },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    await new UpdatePharmacyInfo(pharmacyRepo).execute(id, input);
    return c.json({ message: "Infos mises à jour" }, 200);
  }
);

// PATCH /my/pharmacies/:id/hours  (staff+)
ctrl.openapi(
  createRoute({
    method: "patch",
    path: "/:id/hours",
    security: sec,
    request: {
      params: z.object({ id: z.string() }),
      body: { content: { "application/json": { schema: UpdatePharmacyHoursSchema } } },
    },
    responses: { 200: { description: "Horaires mis à jour" } },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    await new UpdatePharmacyHours(pharmacyRepo).execute(id, input);
    return c.json({ message: "Horaires mis à jour" }, 200);
  }
);

// PUT /my/pharmacies/:id/images  (staff+)
ctrl.openapi(
  createRoute({
    method: "put",
    path: "/:id/images",
    security: sec,
    request: {
      params: z.object({ id: z.string() }),
      body: {
        content: {
          "application/json": { schema: z.object({ images: z.array(z.string()) }) },
        },
      },
    },
    responses: { 200: { description: "Images mises à jour" } },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const { images } = c.req.valid("json");
    await new UpdatePharmacyImages(pharmacyRepo).execute(id, images);
    return c.json({ message: "Images mises à jour" }, 200);
  }
);

// GET /my/pharmacies/:id/search-history  (staff+)
ctrl.use("/:id/search-history", requirePharmacyRole(membershipRepo, "staff"));
ctrl.get("/:id/search-history", async (c) => {
  const id = c.req.param("id");
  const { MongoMedSearchRepository } = await import(
    "@/modules/pharmacy/infrastructure/repositories/MedSearchRepository"
  );
  const searchRepo = new MongoMedSearchRepository();
  const history = await searchRepo.findHistoryForPharmacy(id);
  return c.json({ history }, 200);
});

// GET /my/pharmacies/:id/members  (staff+)
ctrl.openapi(
  createRoute({
    method: "get",
    path: "/:id/members",
    security: sec,
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        content: { "application/json": { schema: PharmacyMembersResponseSchema } },
        description: "Membres de la pharmacie",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const members = await new ListMembers(membershipRepo, userRepo).execute(id);
    return c.json({ members }, 200);
  }
);

// POST /my/pharmacies/:id/invitations  (admin+ ; superadmin requis pour inviter un admin)
ctrl.openapi(
  createRoute({
    method: "post",
    path: "/:id/invitations",
    security: sec,
    request: {
      params: z.object({ id: z.string() }),
      body: { content: { "application/json": { schema: InviteMemberSchema } } },
    },
    responses: { 201: { description: "Invitation envoyée" } },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const { email, role } = c.req.valid("json");
    const membership = c.get("pharmacyMembership")!;
    await new InviteMember(
      invitationRepo,
      membershipRepo,
      userRepo,
      pharmacyRepo,
      mailer
    ).execute(id, membership.role, email, role);
    return c.json({ message: "Invitation envoyée" }, 201);
  }
);

// DELETE /my/pharmacies/:id/members/:userId  (admin retire staff ; superadmin retire tout)
ctrl.openapi(
  createRoute({
    method: "delete",
    path: "/:id/members/:userId",
    security: sec,
    request: { params: z.object({ id: z.string(), userId: z.string() }) },
    responses: { 200: { description: "Membre retiré" } },
  }),
  async (c) => {
    const { id, userId } = c.req.valid("param");
    const membership = c.get("pharmacyMembership")!;
    await new RemoveMember(membershipRepo).execute(id, membership.role, userId);
    return c.json({ message: "Membre retiré" }, 200);
  }
);

// PATCH /my/pharmacies/:id/members/:userId/role  (superadmin only)
ctrl.openapi(
  createRoute({
    method: "patch",
    path: "/:id/members/:userId/role",
    security: sec,
    request: {
      params: z.object({ id: z.string(), userId: z.string() }),
      body: { content: { "application/json": { schema: UpdateMemberRoleSchema } } },
    },
    responses: { 200: { description: "Rôle mis à jour" } },
  }),
  async (c) => {
    const { id, userId } = c.req.valid("param");
    const { role } = c.req.valid("json");
    await new UpdateMemberRole(membershipRepo).execute(id, userId, role);
    return c.json({ message: "Rôle mis à jour" }, 200);
  }
);

// ─── Ouvertures / fermetures exceptionnelles (staff+) ─────────────────────────

// POST /my/pharmacies/:id/exceptional
ctrl.openapi(
  createRoute({
    method: "post",
    path: "/:id/exceptional",
    security: sec,
    request: {
      params: z.object({ id: z.string() }),
      body: { content: { "application/json": { schema: CreateExceptionalScheduleSchema } } },
    },
    responses: { 201: { description: "Planning ajouté" } },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const entry = await new AddExceptionalSchedule(pharmacyRepo).execute(id, input);
    return c.json({ entry }, 201);
  }
);

// PATCH /my/pharmacies/:id/exceptional/:scheduleId
ctrl.openapi(
  createRoute({
    method: "patch",
    path: "/:id/exceptional/:scheduleId",
    security: sec,
    request: {
      params: z.object({ id: z.string(), scheduleId: z.string() }),
      body: { content: { "application/json": { schema: UpdateExceptionalScheduleSchema } } },
    },
    responses: { 200: { description: "Planning mis à jour" } },
  }),
  async (c) => {
    const { id, scheduleId } = c.req.valid("param");
    const input = c.req.valid("json");
    const entry = await new UpdateExceptionalSchedule(pharmacyRepo).execute(id, scheduleId, input);
    return c.json({ entry }, 200);
  }
);

// DELETE /my/pharmacies/:id/exceptional/:scheduleId
ctrl.openapi(
  createRoute({
    method: "delete",
    path: "/:id/exceptional/:scheduleId",
    security: sec,
    request: {
      params: z.object({ id: z.string(), scheduleId: z.string() }),
    },
    responses: { 200: { description: "Planning supprimé" } },
  }),
  async (c) => {
    const { id, scheduleId } = c.req.valid("param");
    await new DeleteExceptionalSchedule(pharmacyRepo).execute(id, scheduleId);
    return c.json({ message: "Supprimé" }, 200);
  }
);

// ─── Gardes déclarées par la pharmacie (admin+) ───────────────────────────────

// POST /my/pharmacies/:id/guards
ctrl.openapi(
  createRoute({
    method: "post",
    path: "/:id/guards",
    security: sec,
    request: {
      params: z.object({ id: z.string() }),
      body: { content: { "application/json": { schema: CreatePharmacyGuardSchema } } },
    },
    responses: { 201: { description: "Garde ajoutée" } },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const guard = await new AddPharmacyGuard(pharmacyRepo).execute(id, input);
    return c.json({ guard }, 201);
  }
);

// PATCH /my/pharmacies/:id/guards/:guardId
ctrl.openapi(
  createRoute({
    method: "patch",
    path: "/:id/guards/:guardId",
    security: sec,
    request: {
      params: z.object({ id: z.string(), guardId: z.string() }),
      body: { content: { "application/json": { schema: UpdatePharmacyGuardSchema } } },
    },
    responses: { 200: { description: "Garde mise à jour" } },
  }),
  async (c) => {
    const { id, guardId } = c.req.valid("param");
    const input = c.req.valid("json");
    await new UpdatePharmacyGuard(pharmacyRepo).execute(id, guardId, input);
    return c.json({ message: "Garde mise à jour" }, 200);
  }
);

// DELETE /my/pharmacies/:id/guards/:guardId
ctrl.openapi(
  createRoute({
    method: "delete",
    path: "/:id/guards/:guardId",
    security: sec,
    request: {
      params: z.object({ id: z.string(), guardId: z.string() }),
    },
    responses: { 200: { description: "Garde supprimée" } },
  }),
  async (c) => {
    const { id, guardId } = c.req.valid("param");
    await new DeletePharmacyGuard(pharmacyRepo).execute(id, guardId);
    return c.json({ message: "Supprimé" }, 200);
  }
);

export default ctrl;
