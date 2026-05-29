import { connectToDatabase } from "@/core/database/mongoose";
import { AppError } from "@/core/errors/AppError";
import { ResendMailer } from "@/core/services/mailing/ResendMailer";
import { User } from "@/modules/identity/domain/entities/User";
import authController from "@/modules/identity/infrastructure/controllers/AuthController";
import householdController from "@/modules/identity/infrastructure/controllers/HouseholdController";
import medicationController from "@/modules/medication_management/infrastructure/controllers/MedicationController";
import notificationController from "@/modules/notification/infrastructure/controllers/NotificationController";
import fileController from "@/modules/files/infrastructure/controllers/FileController";
import { initIdentityModule } from "@/modules/identity/infrastructure/identity.module";
import { initPlanningModule } from "@/modules/planning/infrastructure/planning.module";
import { initNotificationModule } from "@/modules/notification/infrastructure/notification.module";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { globalEventBus } from './core/events/EventBus';
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { authLimiter, apiLimiter, uploadLimiter } from "@/core/middleware/rateLimiter";
import { ContentfulStatusCode } from "hono/utils/http-status";

type Variables = {
  user: User;
};

const app = new OpenAPIHono<{ Variables: Variables }>();
const port = Number.parseInt(process.env.PORT || "3000", 10);

// Security middleware
app.use("*", logger());
app.use("*", secureHeaders({
  crossOriginResourcePolicy: "cross-origin",
}));

// CORS — origines autorisées via variable d'environnement
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

// Routes — avec rate limiting différencié par type
app.use("/auth/*", authLimiter);
app.route("/auth", authController);

app.use("/household/*", apiLimiter);
app.route("/household", householdController);

app.use("/medications/*", apiLimiter);
app.route("/medications", medicationController);

app.use("/notifications/*", apiLimiter);
app.route("/notifications", notificationController);

app.use("/files/*", uploadLimiter);
app.route("/files", fileController);

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
