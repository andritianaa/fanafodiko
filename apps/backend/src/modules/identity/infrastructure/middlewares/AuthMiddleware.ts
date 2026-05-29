import { createMiddleware } from "hono/factory";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "@/core/errors/AppError";

import { ITokenService } from "@/modules/identity/application/ports/ITokenService";

export const authMiddleware = (
  tokenService: ITokenService,
  userRepository: IUserRepository,
) => {
  return createMiddleware(async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Missing or invalid token", 401, "UNAUTHORIZED");
    }
    const token = authHeader.split(" ")[1];

    let userId: string;
    try {
      const payload = await tokenService.verify(token);
      userId = payload.sub as string;
    } catch (error) {
      throw new AppError("Invalid or expired token", 401, "TOKEN_INVALID", error);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    c.set("user", user);

    await next();
  });
};
