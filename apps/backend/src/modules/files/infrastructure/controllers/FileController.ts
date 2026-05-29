import { createRoute, z } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "@/modules/identity/infrastructure/middlewares/AuthMiddleware";
import { JwtTokenService } from "@/modules/identity/infrastructure/security/JwtTokenService";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { UploadImage } from "../../application/use-cases/UploadImage";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { AppError } from "@/core/errors/AppError";

const fileController = createController();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const userRepository = new MongoUserRepository();
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me",
);

const uploadImageUseCase = new UploadImage(UPLOAD_DIR);

fileController.use("/upload", authMiddleware(tokenService, userRepository));

const uploadRoute = createRoute({
  method: "post",
  path: "/upload",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.any().openapi({ type: "string", format: "binary" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "File uploaded successfully",
      content: {
        "application/json": {
          schema: z.object({
            filename: z.string(),
            url: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            code: z.string(),
          }),
        },
      },
    },
  },
});

fileController.openapi(uploadRoute, async (c) => {
  const body = await c.req.parseBody();
  const file = body.file as unknown as File;

  if (!file) {
    throw new AppError("No file uploaded", 400, "NO_FILE_UPLOADED");
  }

  const result = await uploadImageUseCase.execute(file);
  return c.json(result, 201);
});

const getFileRoute = createRoute({
  method: "get",
  path: "/{filename}",
  request: {
    params: z.object({
      filename: z.string(),
    }),
  },
  responses: {
    200: {
      description: "File content",
      content: {
        "image/*": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: { description: "File not found" },
  },
});

fileController.openapi(getFileRoute, async (c) => {
  const { filename } = c.req.valid("param");
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!existsSync(filePath)) {
    return c.json({ message: "File not found" }, 404);
  }

  const fileData = await readFile(filePath);
  const ext = path.extname(filename).toLowerCase();
  
  let contentType = "image/jpeg";
  if (ext === ".png") contentType = "image/png";
  if (ext === ".gif") contentType = "image/gif";
  if (ext === ".webp") contentType = "image/webp";
  if (ext === ".svg") contentType = "image/svg+xml";

  return c.body(fileData, 200, {
    "Content-Type": contentType,
  });
});

export default fileController;
