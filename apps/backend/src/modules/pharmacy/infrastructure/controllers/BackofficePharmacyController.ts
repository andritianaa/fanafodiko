import { createRoute, z } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "@/modules/identity/infrastructure/middlewares/AuthMiddleware";
import { adminMiddleware } from "@/modules/identity/infrastructure/middlewares/AdminMiddleware";
import { JwtTokenService } from "@/modules/identity/infrastructure/security/JwtTokenService";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { MongoPharmacyRepository } from "../repositories/PharmacyRepository";
import { CreatePharmacy } from "../../application/use-cases/CreatePharmacy";
import { UpdatePharmacy } from "../../application/use-cases/UpdatePharmacy";
import { DeletePharmacy } from "../../application/use-cases/DeletePharmacy";
import { BatchUpdateGuard } from "../../application/use-cases/BatchUpdateGuard";
import { ToggleGuard } from "../../application/use-cases/ToggleGuard";
import {
  AssignPharmacyOwner,
  ListMembers,
  UpdateMemberRole,
  RemoveMember,
} from "../../application/use-cases/ManageMembers";
import {
  AddExceptionalSchedule,
  UpdateExceptionalSchedule,
  DeleteExceptionalSchedule,
  AddPharmacyGuard,
  UpdatePharmacyGuard,
  DeletePharmacyGuard,
} from "../../application/use-cases/ManageExceptional";
import { MongoPharmacyMembershipRepository } from "../repositories/PharmacyMembershipRepository";
import { MongoPharmacyRequestRepository } from "../repositories/PharmacyRequestRepository";
import {
  ListPharmacyRequests,
  ApprovePharmacyRequest,
  RejectPharmacyRequest,
  ReviewManagement,
} from "../../application/use-cases/ReviewPharmacyRequest";
import { ResendMailer } from "@/core/services/mailing/ResendMailer";
import { serializePharmacy } from "../serializers/pharmacySerializer";
import {
  PharmacyListResponseSchema,
  CreatePharmacySchema,
  UpdatePharmacySchema,
  BatchGuardSchema,
  ToggleGuardSchema,
  AssignOwnerSchema,
  UpdateMemberRoleSchema,
  PharmacyMembersResponseSchema,
  PharmacyRequestsResponseSchema,
  RejectRequestSchema,
  CreateExceptionalScheduleSchema,
  UpdateExceptionalScheduleSchema,
  CreatePharmacyGuardSchema,
  UpdatePharmacyGuardSchema,
} from "@ext/schemas";

const ctrl = createController();
const repo = new MongoPharmacyRepository();
const membershipRepo = new MongoPharmacyMembershipRepository();
const requestRepo = new MongoPharmacyRequestRepository();
const userRepo = new MongoUserRepository();
const mailer = new ResendMailer(process.env.RESEND_API_KEY || "re_xxxxxx");
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me",
);

ctrl.use("*", authMiddleware(tokenService, userRepo));
ctrl.use("*", adminMiddleware);

// GET /backoffice/pharmacies
const listRoute = createRoute({
  method: "get",
  path: "/",
  security: [{ AuthorizationApiKey: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: PharmacyListResponseSchema } },
      description: "Toutes les pharmacies",
    },
  },
});

ctrl.openapi(listRoute, async (c) => {
  const pharmacies = await repo.findAll();
  const data = pharmacies.map((p) => serializePharmacy(p));
  return c.json({ pharmacies: data, total: data.length }, 200);
});

// POST /backoffice/pharmacies
const createRoute_ = createRoute({
  method: "post",
  path: "/",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    body: { content: { "application/json": { schema: CreatePharmacySchema } } },
  },
  responses: { 201: { description: "Pharmacie créée" } },
});

ctrl.openapi(createRoute_, async (c) => {
  const input = c.req.valid("json");
  const useCase = new CreatePharmacy(repo);
  const pharmacy = await useCase.execute(input);
  return c.json({ id: pharmacy.id }, 201);
});

// PUT /backoffice/pharmacies/:id
const updateRoute = createRoute({
  method: "put",
  path: "/:id",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: UpdatePharmacySchema } } },
  },
  responses: { 200: { description: "Pharmacie mise à jour" } },
});

ctrl.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid("param");
  const input = c.req.valid("json");
  const useCase = new UpdatePharmacy(repo);
  await useCase.execute(id, input);
  return c.json({ message: "Mis à jour" }, 200);
});

// DELETE /backoffice/pharmacies/:id
const deleteRoute = createRoute({
  method: "delete",
  path: "/:id",
  security: [{ AuthorizationApiKey: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Pharmacie supprimée" } },
});

ctrl.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid("param");
  const useCase = new DeletePharmacy(repo);
  await useCase.execute(id);
  return c.json({ message: "Pharmacie supprimée" }, 200);
});

// POST /backoffice/pharmacies/guard/batch
const batchGuardRoute = createRoute({
  method: "post",
  path: "/guard/batch",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    body: { content: { "application/json": { schema: BatchGuardSchema } } },
  },
  responses: { 200: { description: "Gardes mises à jour" } },
});

ctrl.openapi(batchGuardRoute, async (c) => {
  const input = c.req.valid("json");
  const useCase = new BatchUpdateGuard(repo);
  await useCase.execute(input);
  return c.json({ message: "Gardes mises à jour" }, 200);
});

// PATCH /backoffice/pharmacies/:id/guard
const toggleGuardRoute = createRoute({
  method: "patch",
  path: "/:id/guard",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: ToggleGuardSchema } } },
  },
  responses: { 200: { description: "Garde modifiée" } },
});

ctrl.openapi(toggleGuardRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { weekIdentifier, isActive } = c.req.valid("json");
  const useCase = new ToggleGuard(repo);
  await useCase.execute(id, weekIdentifier, isActive);
  return c.json({ message: "Garde modifiée" }, 200);
});

// POST /backoffice/pharmacies/:id/owner,assigne un superadmin (propriétaire)
const assignOwnerRoute = createRoute({
  method: "post",
  path: "/:id/owner",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: AssignOwnerSchema } } },
  },
  responses: {
    200: { description: "Propriétaire assigné" },
    404: { description: "Utilisateur introuvable" },
  },
});

ctrl.openapi(assignOwnerRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { email } = c.req.valid("json");
  await new AssignPharmacyOwner(membershipRepo, userRepo).execute(id, email);
  return c.json({ message: "Propriétaire assigné" }, 200);
});

// ─── Gestion du staff des pharmacies (admin app) ──────────────────────────────

// GET /backoffice/pharmacies/:id/members
ctrl.openapi(
  createRoute({
    method: "get",
    path: "/:id/members",
    security: [{ AuthorizationApiKey: [] }],
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        content: {
          "application/json": { schema: PharmacyMembersResponseSchema },
        },
        description: "Membres de la pharmacie",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const members = await new ListMembers(membershipRepo, userRepo).execute(id);
    return c.json({ members }, 200);
  },
);

// DELETE /backoffice/pharmacies/:id/members/:userId  (l'admin app peut retirer même un superadmin)
ctrl.openapi(
  createRoute({
    method: "delete",
    path: "/:id/members/:userId",
    security: [{ AuthorizationApiKey: [] }],
    request: { params: z.object({ id: z.string(), userId: z.string() }) },
    responses: { 200: { description: "Membre retiré" } },
  }),
  async (c) => {
    const { id, userId } = c.req.valid("param");
    // L'admin app bypass les restrictions de rôle, suppression directe
    await membershipRepo.delete(id, userId);
    return c.json({ message: "Membre retiré" }, 200);
  },
);

// PATCH /backoffice/pharmacies/:id/members/:userId/role
ctrl.openapi(
  createRoute({
    method: "patch",
    path: "/:id/members/:userId/role",
    security: [{ AuthorizationApiKey: [] }],
    request: {
      params: z.object({ id: z.string(), userId: z.string() }),
      body: {
        content: { "application/json": { schema: UpdateMemberRoleSchema } },
      },
    },
    responses: { 200: { description: "Rôle mis à jour" } },
  }),
  async (c) => {
    const { id, userId } = c.req.valid("param");
    const { role } = c.req.valid("json");
    await new UpdateMemberRole(membershipRepo).execute(id, userId, role);
    return c.json({ message: "Rôle mis à jour" }, 200);
  },
);

// ─── Demandes de pharmacie (soumissions utilisateurs) ───────────────────────

// GET /backoffice/pharmacies/requests
ctrl.openapi(
  createRoute({
    method: "get",
    path: "/requests",
    security: [{ AuthorizationApiKey: [] }],
    responses: {
      200: {
        content: {
          "application/json": { schema: PharmacyRequestsResponseSchema },
        },
        description: "Demandes de pharmacie",
      },
    },
  }),
  async (c) => {
    const requests = await new ListPharmacyRequests(requestRepo).execute(
      userRepo,
    );
    return c.json({ requests, total: requests.length }, 200);
  },
);

// POST /backoffice/pharmacies/requests/:reqId/approve
ctrl.openapi(
  createRoute({
    method: "post",
    path: "/requests/:reqId/approve",
    security: [{ AuthorizationApiKey: [] }],
    request: { params: z.object({ reqId: z.string() }) },
    responses: { 200: { description: "Demande approuvée" } },
  }),
  async (c) => {
    const { reqId } = c.req.valid("param");
    const reviewer = c.get("user");
    const result = await new ApprovePharmacyRequest(
      requestRepo,
      repo,
      userRepo,
      mailer,
    ).execute(reqId, reviewer.id!);
    return c.json({ message: "Demande approuvée", ...result }, 200);
  },
);

// POST /backoffice/pharmacies/requests/:reqId/reject
ctrl.openapi(
  createRoute({
    method: "post",
    path: "/requests/:reqId/reject",
    security: [{ AuthorizationApiKey: [] }],
    request: {
      params: z.object({ reqId: z.string() }),
      body: {
        content: { "application/json": { schema: RejectRequestSchema } },
      },
    },
    responses: { 200: { description: "Demande refusée" } },
  }),
  async (c) => {
    const { reqId } = c.req.valid("param");
    const { reason } = c.req.valid("json");
    const reviewer = c.get("user");
    await new RejectPharmacyRequest(requestRepo, userRepo, mailer).execute(
      reqId,
      reviewer.id!,
      reason,
    );
    return c.json({ message: "Demande refusée" }, 200);
  },
);

// POST /backoffice/pharmacies/requests/:reqId/management/:decision  (approve|reject)
ctrl.openapi(
  createRoute({
    method: "post",
    path: "/requests/:reqId/management/:decision",
    security: [{ AuthorizationApiKey: [] }],
    request: {
      params: z.object({
        reqId: z.string(),
        decision: z.enum(["approve", "reject"]),
      }),
    },
    responses: { 200: { description: "Décision de gestion enregistrée" } },
  }),
  async (c) => {
    const { reqId, decision } = c.req.valid("param");
    await new ReviewManagement(
      requestRepo,
      membershipRepo,
      userRepo,
      mailer,
    ).execute(reqId, decision === "approve");
    return c.json({ message: "Décision enregistrée" }, 200);
  },
);

// DELETE /backoffice/pharmacies/requests/:reqId
ctrl.openapi(
  createRoute({
    method: "delete",
    path: "/requests/:reqId",
    security: [{ AuthorizationApiKey: [] }],
    request: { params: z.object({ reqId: z.string() }) },
    responses: { 200: { description: "Demande supprimée" } },
  }),
  async (c) => {
    const { reqId } = c.req.valid("param");
    const request = await requestRepo.findById(reqId);
    if (!request) {
      return c.json({ message: "Demande introuvable" }, 404 as any);
    }
    await requestRepo.delete(reqId);
    return c.json({ message: "Demande supprimée" }, 200);
  },
);

// GET /backoffice/pharmacies/:id, doit être déclaré APRÈS toutes les routes statiques (/requests, etc.)
ctrl.openapi(
  createRoute({
    method: "get",
    path: "/:id",
    security: [{ AuthorizationApiKey: [] }],
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: PharmacyListResponseSchema.shape.pharmacies.element,
          },
        },
        description: "Détail pharmacie",
      },
      404: { description: "Introuvable" },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const pharmacy = await repo.findById(id);
    if (!pharmacy) return c.json({ message: "Introuvable" } as any, 404);
    return c.json(serializePharmacy(pharmacy), 200);
  },
);

// ─── Exceptions d'horaires (admin app bypass membership) ─────────────────────

ctrl.openapi(
  createRoute({
    method: "post",
    path: "/:id/exceptional",
    security: [{ AuthorizationApiKey: [] }],
    request: {
      params: z.object({ id: z.string() }),
      body: {
        content: {
          "application/json": { schema: CreateExceptionalScheduleSchema },
        },
      },
    },
    responses: { 201: { description: "Exception ajoutée" } },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    await new AddExceptionalSchedule(repo).execute(id, input);
    return c.json({ message: "Exception ajoutée" }, 201);
  },
);

ctrl.openapi(
  createRoute({
    method: "patch",
    path: "/:id/exceptional/:scheduleId",
    security: [{ AuthorizationApiKey: [] }],
    request: {
      params: z.object({ id: z.string(), scheduleId: z.string() }),
      body: {
        content: {
          "application/json": { schema: UpdateExceptionalScheduleSchema },
        },
      },
    },
    responses: { 200: { description: "Exception mise à jour" } },
  }),
  async (c) => {
    const { id, scheduleId } = c.req.valid("param");
    const input = c.req.valid("json");
    await new UpdateExceptionalSchedule(repo).execute(id, scheduleId, input);
    return c.json({ message: "Exception mise à jour" }, 200);
  },
);

ctrl.openapi(
  createRoute({
    method: "delete",
    path: "/:id/exceptional/:scheduleId",
    security: [{ AuthorizationApiKey: [] }],
    request: {
      params: z.object({ id: z.string(), scheduleId: z.string() }),
    },
    responses: { 200: { description: "Exception supprimée" } },
  }),
  async (c) => {
    const { id, scheduleId } = c.req.valid("param");
    await new DeleteExceptionalSchedule(repo).execute(id, scheduleId);
    return c.json({ message: "Exception supprimée" }, 200);
  },
);

// ─── Gardes déclarées par la pharmacie (admin app bypass membership) ──────────

ctrl.openapi(
  createRoute({
    method: "post",
    path: "/:id/guards",
    security: [{ AuthorizationApiKey: [] }],
    request: {
      params: z.object({ id: z.string() }),
      body: {
        content: { "application/json": { schema: CreatePharmacyGuardSchema } },
      },
    },
    responses: { 201: { description: "Garde ajoutée" } },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    await new AddPharmacyGuard(repo).execute(id, input);
    return c.json({ message: "Garde ajoutée" }, 201);
  },
);

ctrl.openapi(
  createRoute({
    method: "patch",
    path: "/:id/guards/:guardId",
    security: [{ AuthorizationApiKey: [] }],
    request: {
      params: z.object({ id: z.string(), guardId: z.string() }),
      body: {
        content: { "application/json": { schema: UpdatePharmacyGuardSchema } },
      },
    },
    responses: { 200: { description: "Garde mise à jour" } },
  }),
  async (c) => {
    const { id, guardId } = c.req.valid("param");
    const input = c.req.valid("json");
    await new UpdatePharmacyGuard(repo).execute(id, guardId, input);
    return c.json({ message: "Garde mise à jour" }, 200);
  },
);

ctrl.openapi(
  createRoute({
    method: "delete",
    path: "/:id/guards/:guardId",
    security: [{ AuthorizationApiKey: [] }],
    request: {
      params: z.object({ id: z.string(), guardId: z.string() }),
    },
    responses: { 200: { description: "Garde supprimée" } },
  }),
  async (c) => {
    const { id, guardId } = c.req.valid("param");
    await new DeletePharmacyGuard(repo).execute(id, guardId);
    return c.json({ message: "Garde supprimée" }, 200);
  },
);

export default ctrl;
