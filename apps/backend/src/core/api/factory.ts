import { OpenAPIHono } from "@hono/zod-openapi";
import { HonoEnv } from "@/core/types/hono-env";

export const createController = () => new OpenAPIHono<HonoEnv>();
