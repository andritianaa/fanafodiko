import { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: ContentfulStatusCode = 400,
    public code?: string,
    public cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}
