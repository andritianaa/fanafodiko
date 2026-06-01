import { createRoute, z } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "@/modules/identity/infrastructure/middlewares/AuthMiddleware";
import { JwtTokenService } from "@/modules/identity/infrastructure/security/JwtTokenService";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { MongoMedSearchRepository } from "../repositories/MedSearchRepository";
import { MongoPharmacyMembershipRepository } from "../repositories/PharmacyMembershipRepository";
import { PharmacyMembershipModel } from "../models/PharmacyMembershipModel";
import { UserModel } from "@/modules/identity/infrastructure/models/UserModel";
import { PharmacyModel } from "../models/PharmacyModel";
import { CreateMedSearch } from "../../application/use-cases/CreateMedSearch";
import { RespondToSearch } from "../../application/use-cases/RespondToSearch";
import { sseManager } from "../sse/SseManager";
import { AppError } from "@/core/errors/AppError";
import { randomUUID } from "node:crypto";
import { streamSSE } from "hono/streaming";
import { CreateMedSearchSchema, RespondToSearchSchema } from "@ext/schemas";
import { ResendMailer } from "@/core/services/mailing/ResendMailer";
import { medSearchEmailTemplate } from "@/core/services/mailing/emailTemplates";

const ctrl = createController();

const userRepo = new MongoUserRepository();
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me",
);
const searchRepo = new MongoMedSearchRepository();
const membershipRepo = new MongoPharmacyMembershipRepository();
const mailer = new ResendMailer(process.env.RESEND_API_KEY || "re_xxx");

const APP_URL = process.env.SOURCE_URL || "http://localhost:5173";

ctrl.use("*", authMiddleware(tokenService, userRepo));

// ── POST /med-searches,Créer une recherche ──────────────────────────────────
const createRoute_ = createRoute({
  method: "post",
  path: "/",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateMedSearchSchema } },
    },
  },
  responses: {
    201: {
      description: "Recherche créée",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            nearbyCount: z.number(),
            expiresAt: z.string(),
          }),
        },
      },
    },
  },
});

ctrl.openapi(createRoute_, async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const useCase = new CreateMedSearch(searchRepo);
  const search = await useCase.execute(input, user.id!);

  // Envoyer des emails aux membres des pharmacies à proximité (fire-and-forget)
  const pharmacyIds = search.props.nearbyPharmacies.map((p) => p.id);
  if (pharmacyIds.length > 0) {
    sendMemberEmails(
      pharmacyIds,
      search.props.medicationName,
      input.note,
      input.radiusKm,
    ).catch((err) => console.error("[MedSearch] email error:", err));
  }

  return c.json(
    {
      id: search.id!,
      nearbyCount: search.props.nearbyPharmacies.length,
      expiresAt: search.props.expiresAt.toISOString(),
    },
    201,
  );
});

/** Récupère les emails de tous les membres des pharmacies concernées et envoie une notif. */
async function sendMemberEmails(
  pharmacyIds: string[],
  medicationName: string,
  note: string | undefined,
  radiusKm: number,
): Promise<void> {
  // Memberships de toutes les pharmacies en une seule requête
  const memberships = await PharmacyMembershipModel.find({
    pharmacyId: { $in: pharmacyIds },
  }).lean();

  if (memberships.length === 0) return;

  // Dédupliquer les userIds
  const userIds = [...new Set(memberships.map((m) => m.userId))];

  // Récupérer les emails des membres
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select("_id email")
    .lean();

  const emailMap = new Map(users.map((u) => [u._id.toString(), u.email]));

  // Nom de pharmacie par pharmacyId (pour personnaliser l'email)
  const pharmacies = await PharmacyModel.find({ _id: { $in: pharmacyIds } })
    .select("_id name")
    .lean();
  const pharmacyNameMap = new Map(
    pharmacies.map((p) => [p._id.toString(), p.name]),
  );

  // Envoyer un email par membre (en parallèle, limité à 10 à la fois)
  const sends = memberships.map(async (m) => {
    const email = emailMap.get(m.userId);
    if (!email) return;
    const pharmacyName = pharmacyNameMap.get(m.pharmacyId) ?? "votre pharmacie";
    const { subject, html } = medSearchEmailTemplate({
      pharmacyName,
      medicationName,
      note,
      radiusKm,
      manageUrl: `${APP_URL}/my-pharmacy`,
    });
    await mailer.sendEmail(email, subject, html);
  });

  // Batch de 10 envois max en parallèle
  for (let i = 0; i < sends.length; i += 10) {
    await Promise.allSettled(sends.slice(i, i + 10));
  }
}

// ── GET /med-searches/my,Historique de l'utilisateur connecté ──────────────
ctrl.get("/my", async (c) => {
  const user = c.get("user");
  const history = await searchRepo.findHistoryByUserId(user.id!);
  return c.json({ history }, 200);
});

// ── GET /med-searches/pharmacy/:pharmacyId/pending,Polling pharmacie ───────
ctrl.get("/pharmacy/:pharmacyId/pending", async (c) => {
  const pharmacyId = c.req.param("pharmacyId");
  const user = c.get("user");

  const membership = await membershipRepo.findByPharmacyAndUser(
    pharmacyId,
    user.id!,
  );
  if (!membership) throw new AppError("Accès refusé", 403, "FORBIDDEN");

  const searches = await searchRepo.findActivePendingForPharmacy(pharmacyId);

  return c.json(
    searches.map((s) => ({
      searchId: s.id!,
      medicationName: s.props.medicationName,
      note: s.props.note,
      radiusKm: s.props.radiusKm,
      createdAt: s.props.createdAt?.toISOString(),
    })),
    200,
  );
});

// ── GET /med-searches/:id,Détail + réponses ─────────────────────────────────
const getRoute = createRoute({
  method: "get",
  path: "/:id",
  security: [{ AuthorizationApiKey: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Recherche + réponses" } },
});

ctrl.openapi(getRoute, async (c) => {
  const { id } = c.req.valid("param");
  const search = await searchRepo.findById(id);
  if (!search) throw new AppError("Recherche introuvable", 404, "NOT_FOUND");
  const responses = await searchRepo.findResponsesBySearch(id);

  return c.json(
    {
      id: search.id,
      medicationName: search.props.medicationName,
      coordinates: search.props.coordinates,
      radiusKm: search.props.radiusKm,
      note: search.props.note,
      status: search.props.status,
      nearbyPharmacies: search.props.nearbyPharmacies,
      responses: responses.map((r) => ({
        pharmacyId: r.props.pharmacyId,
        pharmacyName: r.props.pharmacyName,
        hasStock: r.props.hasStock,
        note: r.props.note,
        distance: r.props.distance,
        respondedAt: r.props.respondedAt?.toISOString(),
      })),
      expiresAt: search.props.expiresAt.toISOString(),
      createdAt: search.props.createdAt?.toISOString(),
    },
    200,
  );
});

// ── GET /med-searches/:id/stream,SSE pour le chercheur ─────────────────────
ctrl.get("/:id/stream", async (c) => {
  const searchId = c.req.param("id");
  const clientId = randomUUID();

  return streamSSE(c, async (stream) => {
    let alive = true;
    // writeChain garantit que les écritures sont séquentielles (pas de concurrent write)
    let writeChain: Promise<void> = Promise.resolve();

    const safeWrite = (data: string, event: string) => {
      if (!alive) return;
      writeChain = writeChain.then(async () => {
        if (!alive) return;
        try {
          await stream.writeSSE({ data, event });
        } catch {
          alive = false;
        }
      });
    };

    const unsub = sseManager.subscribeSearch(
      searchId,
      clientId,
      (data, event) => {
        safeWrite(data, event ?? "response");
      },
    );

    safeWrite(JSON.stringify({ type: "connected", searchId }), "connected");

    stream.onAbort(() => {
      alive = false;
      unsub();
    });

    // Keepalive toutes les 8 s (< idleTimeout Bun = 10 s par défaut)
    while (alive) {
      await stream.sleep(8000);
      if (alive) safeWrite("ping", "ping");
    }
    await writeChain;
    unsub();
  });
});

// ── POST /med-searches/:id/respond,Répondre (staff pharmacie) ───────────────
const respondRoute = createRoute({
  method: "post",
  path: "/:id/respond",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({ id: z.string(), pharmacyId: z.string() }),
    body: {
      content: { "application/json": { schema: RespondToSearchSchema } },
    },
  },
  responses: { 200: { description: "Réponse enregistrée" } },
});

// Custom handler (not openapi) to support pharmacyId in path
ctrl.post("/:id/respond/:pharmacyId", async (c) => {
  const user = c.get("user");
  const searchId = c.req.param("id");
  const pharmacyId = c.req.param("pharmacyId");

  // Check membership
  const membership = await membershipRepo.findByPharmacyAndUser(
    pharmacyId,
    user.id!,
  );
  if (!membership) throw new AppError("Accès refusé", 403, "FORBIDDEN");

  const body = await c.req.json();

  // Get pharmacy name
  const search = await searchRepo.findById(searchId);
  if (!search) throw new AppError("Recherche introuvable", 404, "NOT_FOUND");
  const nearby = search.props.nearbyPharmacies.find((p) => p.id === pharmacyId);
  const pharmacyName = nearby?.name ?? "Pharmacie";

  const useCase = new RespondToSearch(searchRepo);
  await useCase.execute(
    searchId,
    pharmacyId,
    pharmacyName,
    user.id!,
    body.hasStock,
    body.note,
  );

  return c.json({ message: "Réponse enregistrée" }, 200);
});

// ── GET /med-searches/pharmacy-stream,SSE pour staff pharmacie ──────────────
ctrl.get("/pharmacy-stream/:pharmacyId", async (c) => {
  const pharmacyId = c.req.param("pharmacyId");
  const user = c.get("user");
  const clientId = randomUUID();

  // Check membership
  const membership = await membershipRepo.findByPharmacyAndUser(
    pharmacyId,
    user.id!,
  );
  if (!membership) throw new AppError("Accès refusé", 403, "FORBIDDEN");

  return streamSSE(c, async (stream) => {
    const unsub = sseManager.subscribePharmacy(
      pharmacyId,
      clientId,
      (data, event) => {
        stream.writeSSE({ data, event: event ?? "new-search" });
      },
    );

    await stream.writeSSE({
      data: JSON.stringify({ type: "connected", pharmacyId }),
      event: "connected",
    });

    let alive = true;
    stream.onAbort(() => {
      alive = false;
      unsub();
    });

    while (alive) {
      await stream.sleep(25000);
      if (alive) {
        try {
          await stream.writeSSE({ data: "ping", event: "ping" });
        } catch {
          alive = false;
        }
      }
    }
    unsub();
  });
});

export default ctrl;
