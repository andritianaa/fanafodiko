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
import { AssignPharmacyOwner } from "../../application/use-cases/ManageMembers";
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
  PharmacyRequestsResponseSchema,
  RejectRequestSchema,
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

export default ctrl;
