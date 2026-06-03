import { connectToDatabase } from "@/core/database/mongoose";
import { AppError } from "@/core/errors/AppError";
import { ResendMailer } from "@/core/services/mailing/ResendMailer";
import { User } from "@/modules/identity/domain/entities/User";
import authController from "@/modules/identity/infrastructure/controllers/AuthController";
import householdController from "@/modules/identity/infrastructure/controllers/HouseholdController";
import backofficeController from "@/modules/identity/infrastructure/controllers/BackofficeController";
import pharmacyController from "@/modules/pharmacy/infrastructure/controllers/PharmacyController";
import backofficePharmacyController from "@/modules/pharmacy/infrastructure/controllers/BackofficePharmacyController";
import myPharmacyController from "@/modules/pharmacy/infrastructure/controllers/MyPharmacyController";
import pharmacyInvitationController from "@/modules/pharmacy/infrastructure/controllers/PharmacyInvitationController";
import pharmacyRequestController from "@/modules/pharmacy/infrastructure/controllers/PharmacyRequestController";
import medSearchController from "@/modules/pharmacy/infrastructure/controllers/MedSearchController";
import geocodingController from "@/modules/pharmacy/infrastructure/controllers/GeocodingController";
import bugReportController from "@/modules/bugReport/infrastructure/controllers/BugReportController";
import backofficeBugReportController from "@/modules/bugReport/infrastructure/controllers/BackofficeBugReportController";
import medicationController from "@/modules/medication_management/infrastructure/controllers/MedicationController";
import notificationController from "@/modules/notification/infrastructure/controllers/NotificationController";
import fileController from "@/modules/files/infrastructure/controllers/FileController";
import { initIdentityModule } from "@/modules/identity/infrastructure/identity.module";
import { initPlanningModule } from "@/modules/planning/infrastructure/planning.module";
import { initNotificationModule } from "@/modules/notification/infrastructure/notification.module";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { globalEventBus } from "./core/events/EventBus";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { getCookie } from "hono/cookie";
import {
  authLimiter,
  apiLimiter,
  uploadLimiter,
} from "@/core/middleware/rateLimiter";
import { ContentfulStatusCode } from "hono/utils/http-status";

type Variables = {
  user: User;
};

const app = new OpenAPIHono<{ Variables: Variables }>();
const port = Number.parseInt(process.env.PORT || "3000", 10);

// Security middleware
app.use("*", logger());
app.use(
  "*",
  secureHeaders({
    crossOriginResourcePolicy: "cross-origin",
    // Empêche le clickjacking
    xFrameOptions: "DENY",
    // Force HTTPS pendant 1 an en production
    strictTransportSecurity: "max-age=31536000; includeSubDomains",
    // Désactive le sniffing de type MIME
    xContentTypeOptions: "nosniff",
  }),
);

// Protection CSRF : les requêtes cookie-authentifiées doivent porter
// le header X-Requested-With (impossible à envoyer depuis un formulaire HTML cross-origin).
// Les requêtes mobiles n'ont pas de cookie auth_token → ce check est ignoré pour elles.
app.use("*", async (c, next) => {
  const method = c.req.method;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const hasCookie = !!getCookie(c, "auth_token");
    if (hasCookie) {
      const xRequested = c.req.header("x-requested-with");
      if (!xRequested || xRequested.toLowerCase() !== "xmlhttprequest") {
        return c.json({ message: "Requête non autorisée (CSRF)", code: "CSRF_REJECTED" }, 403);
      }
    }
  }
  await next();
});

// CORS, origines autorisées via variable d'environnement
// Les apps mobiles (React Native/Expo) ne sont PAS des navigateurs :
// elles ignorent CORS et peuvent appeler le backend sans restriction.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  "*",
  cors({
    origin: (origin) => {
      // Pas d'origine = requête mobile/curl/server-to-server → autorisé
      if (!origin) return origin;
      if (allowedOrigins.includes(origin)) return origin;
      return undefined; // bloqué
    },
    credentials: true,
  }),
);

app.openAPIRegistry.registerComponent(
  "securitySchemes",
  "AuthorizationApiKey",
  {
    type: "apiKey",
    name: "Authorization",
    in: "header",
  },
);

// Error handling
app.onError((error, c) => {
  if (error instanceof AppError) {
    return c.json(
      {
        message: error.message,
        code: error.code,
      },
      error.statusCode,
    );
  }

  console.error(error);
  return c.json(
    {
      message: "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR",
    },
    500 as ContentfulStatusCode,
  );
});

// Routes, avec rate limiting différencié par type
// authLimiter (10/15min) uniquement sur les routes sensibles au brute-force
app.use("/auth/login", authLimiter);
app.use("/auth/register", authLimiter);
app.use("/auth/password/reset", authLimiter);
app.use("/auth/password/confirm", authLimiter);
// Les routes authentifiées (/me, /password/change, /email/change) utilisent apiLimiter
app.use("/auth/me", apiLimiter);
app.use("/auth/password/change", apiLimiter);
app.use("/auth/email/change", apiLimiter);
app.route("/auth", authController);

app.use("/household/*", apiLimiter);
app.route("/household", householdController);

app.use("/medications/*", apiLimiter);
app.route("/medications", medicationController);

app.use("/notifications/*", apiLimiter);
app.route("/notifications", notificationController);

app.use("/files/*", uploadLimiter);
app.route("/files", fileController);

app.use("/backoffice/*", apiLimiter);
app.route("/backoffice", backofficeController);
app.route("/backoffice/pharmacies", backofficePharmacyController);

app.use("/pharmacies/*", apiLimiter);
app.route("/pharmacies", pharmacyController);

app.use("/my/pharmacies/*", apiLimiter);
app.route("/my/pharmacies", myPharmacyController);

app.use("/pharmacy-invitations/*", apiLimiter);
app.route("/pharmacy-invitations", pharmacyInvitationController);

app.use("/pharmacy-requests/*", apiLimiter);
app.route("/pharmacy-requests", pharmacyRequestController);

app.use("/med-searches/*", apiLimiter);
app.route("/med-searches", medSearchController);

app.use("/geocoding/*", apiLimiter);
app.route("/geocoding", geocodingController);

app.use("/bug-reports/*", apiLimiter);
app.route("/bug-reports", bugReportController);
app.route("/backoffice/bug-reports", backofficeBugReportController);

// Routes
app.get("/", (c) => {
  return c.json({
    message: "ext Backend API",
    version: "1.0.0",
    documentation: "/docs",
  });
});

app.get("/health", async (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// OpenAPI Documentation
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "My Backend API",
    version: "1.0.0",
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: "Development server",
    },
  ],
  security: [
    {
      Bearer: [],
    },
  ],
});

app.get("/docs", swaggerUI({ url: "/openapi.json" }));

async function startServer(port: number) {
  try {
    console.log("🚀 Starting Backend...\n");

    await connectToDatabase();

    const resendKey = process.env.RESEND_API_KEY || "re_xxxxxx";
    console.log(resendKey);

    initIdentityModule(globalEventBus, new ResendMailer(resendKey));
    initPlanningModule(globalEventBus);
    initNotificationModule(resendKey);

    Bun.serve({
      port,
      fetch: app.fetch,
      error(error) {
        console.error("Server error:", error);
        return new Response("Internal Server Error", { status: 500 });
      },
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

try {
  await startServer(port);
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`✅ API Docs: http://localhost:${port}/docs`);
  console.log(`✅ OpenAPI Spec: http://localhost:${port}/openapi.json`);
} catch (error) {
  console.error("Error during server startup:", error);
}
