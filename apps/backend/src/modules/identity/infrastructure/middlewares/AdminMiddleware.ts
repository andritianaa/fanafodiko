import { createMiddleware } from "hono/factory";
import { AppError } from "@/core/errors/AppError";
import { User } from "../../domain/entities/User";

export const adminMiddleware = createMiddleware<{ Variables: { user: User } }>(
  async (c, next) => {
    const user = c.get("user");
    if (user.role !== "admin" && user.role !== "support") {
      throw new AppError("Accès refusé", 403, "FORBIDDEN");
    }
    await next();
  }
);
