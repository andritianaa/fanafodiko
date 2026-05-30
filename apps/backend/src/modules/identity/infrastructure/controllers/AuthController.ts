import { createRoute } from "@hono/zod-openapi";
import { BunPasswordHasher } from "../security/BunPasswordHasher";
import { RegisterUser } from "../../application/use-cases/RegisterUser";
import { ChangePassword } from "../../application/use-cases/ChangePassword";
import { ChangeEmail } from "../../application/use-cases/ChangeEmail";

import { MongoUserRepository } from "../repositories/UserRepository";
import { globalEventBus } from "@/core/events/EventBus";
import { LoginUser } from "../../application/use-cases/LoginUser";
import { MongoSessionRepository } from "../repositories/SessionRepository";
import { authMiddleware } from "../middlewares/AuthMiddleware";
import { createController } from "@/core/api/factory";
import { MongoProfileRepository } from "@/modules/identity/infrastructure/repositories/ProfileRepository";
import { JwtTokenService } from "../security/JwtTokenService";
import { RequestPasswordReset } from "../../application/use-cases/RequestPasswordReset";
import { ConfirmPasswordReset } from "../../application/use-cases/ConfirmPasswordReset";
import { MongoResetPasswordRepository } from "../repositories/ResetPasswordRepository";

import { GetCurrentUser } from "../../application/use-cases/GetCurrentUser";
import {
  LoginResponseSchema,
  LoginSchema,
  LogoutSchema,
  ConfirmPasswordResetResponseSchema,
  ConfirmPasswordResetSchema,
  RequestPasswordResetResponseSchema,
  RequestPasswordResetSchema,
  RegisterResponseSchema,
  RegisterSchema,
  ChangePasswordSchema,
  ChangePasswordResponseSchema,
  ChangeEmailSchema,
  ChangeEmailResponseSchema,
} from "@ext/schemas";

const authController = createController();

const userRepository = new MongoUserRepository();
const sessionRepository = new MongoSessionRepository();
const profileRepository = new MongoProfileRepository();
const passwordHasher = new BunPasswordHasher();
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me",
);
const resetCodeRepository = new MongoResetPasswordRepository();

const registerUseCase = new RegisterUser(
  userRepository,
  passwordHasher,
  globalEventBus,
  profileRepository
);

const registerRoute = createRoute({
  method: "post",
  path: "/register",
  request: {
    body: {
      content: { "application/json": { schema: RegisterSchema } },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: RegisterResponseSchema } },
      description: "User registered successfully",
    },
    400: {
      description: "Invalid input",
    },
    409: {
      description: "User already exists",
    },
  },
});

authController.openapi(registerRoute, async (c) => {
  const data = c.req.valid("json");
  const user = await registerUseCase.execute(data);

  return c.json(
    {
      id: user.id || "temp-id",
      email: user.email,
      message: "User created successfully",
    },
    201,
  );
});

const loginRoute = createRoute({
  method: "post",
  path: "/login",
  request: {
    body: { content: { "application/json": { schema: LoginSchema } } },
  },
  responses: {
    200: {
      description: "Login successful",
      content: { "application/json": { schema: LoginResponseSchema } },
    },
    401: { description: "Unauthorized" },
  },
});

authController.openapi(loginRoute, async (c) => {
  const { email, password } = c.req.valid("json");
  const loginUseCase = new LoginUser(
    userRepository,
    passwordHasher,
    tokenService,
  );

  const result = await loginUseCase.execute(email, password);

  // Web: store token in HttpOnly cookie (inaccessible to JS, safe from XSS)
  // Mobile clients (React Native) ignore cookies and use the token from the response body
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = 7300 * 24 * 60 * 60; // 20 ans en secondes
  const cookieParts = [
    `auth_token=${result.token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (isProd) cookieParts.push("Secure");
  c.header("Set-Cookie", cookieParts.join("; "));

  return c.json(result, 200);
});

const logoutRoute = createRoute({
  method: "post",
  path: "/logout",
  request: {
    body: { content: { "application/json": { schema: LogoutSchema } } },
  },
  responses: {
    200: {
      description: "Logout successful",
    },
  },
});

authController.openapi(logoutRoute, async (c) => {
  // Clear the HttpOnly cookie on web clients (Max-Age=0 supprime immédiatement)
  c.header("Set-Cookie", "auth_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");
  return c.json({ message: "Logout successful" }, 200);
});

const requestPasswordResetRoute = createRoute({
  method: "post",
  path: "/password/reset",
  request: {
    body: { content: { "application/json": { schema: RequestPasswordResetSchema } } },
  },
  responses: {
    200: {
      description: "Reset link sent",
      content: { "application/json": { schema: RequestPasswordResetResponseSchema } },
    },
  },
});

authController.openapi(requestPasswordResetRoute, async (c) => {
  const { email } = c.req.valid("json");
  const useCase = new RequestPasswordReset(
    userRepository,
    resetCodeRepository,
    globalEventBus
  );
  await useCase.execute(email);
  return c.json(
    { message: "If an account with that email exists, a reset link has been sent." },
    200
  );
});

const confirmPasswordResetRoute = createRoute({
  method: "post",
  path: "/password/confirm",
  request: {
    body: { content: { "application/json": { schema: ConfirmPasswordResetSchema } } },
  },
  responses: {
    200: {
      description: "Password reset successful",
      content: { "application/json": { schema: ConfirmPasswordResetResponseSchema } },
    },
    400: { description: "Invalid code" },
  },
});

authController.openapi(confirmPasswordResetRoute, async (c) => {
  const { code, newPassword } = c.req.valid("json");
  const useCase = new ConfirmPasswordReset(
    userRepository,
    resetCodeRepository,
    passwordHasher
  );
  await useCase.execute(code, newPassword);
  return c.json({ message: "Password has been successfully reset." }, 200);
});

const meRoute = createRoute({
  method: "get",
  path: "/me",
  security: [
    {
      AuthorizationApiKey: [],
    },
  ],
  responses: {
    200: {
      description: "User profile",
      content: { "application/json": { schema: RegisterResponseSchema } },
    },
    404: {
      description: "User not found",
    },
  },
});

authController.use("/me", authMiddleware(tokenService, userRepository));
authController.use("/password/change", authMiddleware(tokenService, userRepository));
authController.use("/email/change", authMiddleware(tokenService, userRepository));

authController.openapi(meRoute, async (c) => {
  const user = c.get("user");
  const useCase = new GetCurrentUser(userRepository);
  const currentUser = await useCase.execute(user.id!);

  if (!currentUser) {
     // This should ideally not happen due to authMiddleware check, but for type safety
     return c.json({ id: "", email: "", message: "User not found" }, 404);
  }

  return c.json(
    {
      id: currentUser.id,
      email: currentUser.email,
      message: "Profile retrieved",
    },
    200,
  );
});

const changePasswordRoute = createRoute({
  method: "patch",
  path: "/password/change",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    body: { content: { "application/json": { schema: ChangePasswordSchema } } },
  },
  responses: {
    200: {
      description: "Password changed",
      content: { "application/json": { schema: ChangePasswordResponseSchema } },
    },
    400: { description: "Invalid current password" },
  },
});

authController.openapi(changePasswordRoute, async (c) => {
  const user = c.get("user");
  const { currentPassword, newPassword } = c.req.valid("json");
  const useCase = new ChangePassword(userRepository, passwordHasher);
  await useCase.execute(user.id!, currentPassword, newPassword);
  return c.json({ message: "Mot de passe modifié avec succès." }, 200);
});

const changeEmailRoute = createRoute({
  method: "patch",
  path: "/email/change",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    body: { content: { "application/json": { schema: ChangeEmailSchema } } },
  },
  responses: {
    200: {
      description: "Email changed",
      content: { "application/json": { schema: ChangeEmailResponseSchema } },
    },
    400: { description: "Invalid password" },
    409: { description: "Email already in use" },
  },
});

authController.openapi(changeEmailRoute, async (c) => {
  const user = c.get("user");
  const { newEmail, currentPassword } = c.req.valid("json");
  const useCase = new ChangeEmail(userRepository, passwordHasher);
  const email = await useCase.execute(user.id!, newEmail, currentPassword);
  return c.json({ email, message: "Email modifié avec succès." }, 200);
});

export default authController;
