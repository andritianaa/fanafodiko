import { createRoute, z } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "@/modules/identity/infrastructure/middlewares/AuthMiddleware";
import { adminMiddleware } from "@/modules/identity/infrastructure/middlewares/AdminMiddleware";
import { JwtTokenService } from "@/modules/identity/infrastructure/security/JwtTokenService";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { MongoProfileRepository } from "@/modules/identity/infrastructure/repositories/ProfileRepository";
import { UserModel } from "@/modules/identity/infrastructure/models/UserModel";
import { BugReportModel } from "../models/BugReportModel";
import { InAppNotificationModel } from "@/modules/notification/infrastructure/models/InAppNotificationSchema";
import {
  UpdateBugReportSchema,
  BugReportListResponseSchema,
} from "@ext/schemas";
import { Resend } from "resend";
import { AppError } from "@/core/errors/AppError";

const controller = createController();

const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me",
);
const userRepository = new MongoUserRepository();
const profileRepository = new MongoProfileRepository();

controller.use("*", authMiddleware(tokenService, userRepository));
controller.use("*", adminMiddleware);

// ── GET /backoffice/bug-reports ───────────────────────────────────────────────

const listRoute = createRoute({
  method: "get",
  path: "/",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    query: z.object({
      status: z
        .enum(["open", "resolved", "cancelled", "all"])
        .optional()
        .default("all"),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: BugReportListResponseSchema } },
      description: "Liste des signalements",
    },
  },
});

controller.openapi(listRoute, async (c) => {
  const { status } = c.req.valid("query");
  const filter = status === "all" ? {} : { status };

  const docs = await BugReportModel.find(filter).sort({ createdAt: -1 }).lean();

  const reports = docs.map((d) => ({
    id: String(d._id),
    userId: d.userId,
    userEmail: d.userEmail,
    description: d.description,
    screenshots: d.screenshots ?? [],
    deviceInfo: d.deviceInfo,
    status: d.status,
    adminMessage: d.adminMessage,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return c.json({ reports, total: reports.length }, 200);
});

// ── PATCH /backoffice/bug-reports/:id ─────────────────────────────────────────

const updateRoute = createRoute({
  method: "patch",
  path: "/:id",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: { "application/json": { schema: UpdateBugReportSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ success: z.boolean() }) },
      },
      description: "Signalement mis à jour",
    },
    404: { description: "Signalement introuvable" },
  },
});

controller.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { status, adminMessage } = c.req.valid("json");

  const report = await BugReportModel.findById(id);
  if (!report)
    throw new AppError("Signalement introuvable", 404, "BUG_REPORT_NOT_FOUND");
  if (report.status !== "open")
    throw new AppError(
      "Ce signalement est déjà traité",
      400,
      "ALREADY_PROCESSED",
    );

  // Mise à jour du statut
  await BugReportModel.findByIdAndUpdate(id, {
    status,
    adminMessage,
  });

  const statusLabel = status === "resolved" ? "résolu" : "annulé";
  const notifMessage = `Votre signalement a été ${statusLabel}.${adminMessage ? ` Message de l'équipe : ${adminMessage}` : ""}`;

  // ── Notification in-app ─────────────────────────────────────────────────
  // On cherche le premier profil du foyer de l'utilisateur
  try {
    const profiles = await profileRepository.findAllByAccountId(report.userId);
    const profileId = profiles[0]?.id ?? report.userId;

    await InAppNotificationModel.create({
      profileId,
      type: "bug_report_update",
      bugReportId: id,
      medicationName: `Signalement ${statusLabel}`,
      message: notifMessage,
      read: false,
    });
  } catch {
    console.error("[BugReport] Failed to create in-app notification");
  }

  // ── Email ────────────────────────────────────────────────────────────────
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && report.userEmail) {
      const userDoc = await UserModel.findOne({ email: report.userEmail })
        .select("notificationPreferences")
        .lean();
      if (userDoc?.notificationPreferences?.emailBugReportUpdate !== false) {
        const resend = new Resend(resendKey);
        const emoji = status === "resolved" ? "✅" : "❌";
        await resend.emails.send({
          from: `Fanafodiko <support@${process.env.RESEND_DOMAIN_NAME || "fanafodiko.mg"}>`,
          to: report.userEmail,
          subject: `${emoji} Votre signalement a été ${statusLabel}`,
          html: buildReportEmail({
            status,
            adminMessage,
            description: report.description,
          }),
        });
      }
    }
  } catch {
    console.error("[BugReport] Failed to send email");
  }

  return c.json({ success: true }, 200);
});

// ── Email HTML ────────────────────────────────────────────────────────────────

function buildReportEmail({
  status,
  adminMessage,
  description,
}: {
  status: "resolved" | "cancelled";
  adminMessage: string;
  description: string;
}) {
  const isResolved = status === "resolved";
  const color = isResolved ? "#16a34a" : "#dc2626";
  const label = isResolved ? "✅ Résolu" : "❌ Annulé";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #333; background: #f9f9f9; margin: 0; padding: 0; }
    .wrap { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,.08); }
    .header { background: ${color}; padding: 28px 32px; color: white; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 6px 0 0; opacity: .85; font-size: 14px; }
    .body { padding: 28px 32px; }
    .block { background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 18px 0; font-size: 14px; line-height: 1.6; }
    .block strong { display: block; margin-bottom: 6px; color: #111; }
    .footer { padding: 16px 32px 24px; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>${label}</h1>
      <p>Votre signalement de problème a été traité par notre équipe</p>
    </div>
    <div class="body">
      <p>Bonjour,</p>
      <p>Nous avons ${isResolved ? "résolu" : "annulé"} votre signalement de problème.</p>
      <div class="block">
        <strong>Votre signalement :</strong>
        ${description}
      </div>
      <div class="block">
        <strong>Message de l'équipe :</strong>
        ${adminMessage}
      </div>
      <p>Merci de nous avoir aidés à améliorer Fanafodiko.</p>
    </div>
    <div class="footer">Fanafodiko, Suivi Médical Intelligent · Cet email est automatique, ne pas répondre.</div>
  </div>
</body>
</html>`;
}

export default controller;
