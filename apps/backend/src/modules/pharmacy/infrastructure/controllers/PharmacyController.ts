import { createRoute, z } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { MongoPharmacyRepository } from "../repositories/PharmacyRepository";
import { GetPharmacies } from "../../application/use-cases/GetPharmacies";
import { serializePharmacy } from "../serializers/pharmacySerializer";
import {
  PharmacyListResponseSchema,
  PharmacySearchResponseSchema,
} from "@ext/schemas";

const pharmacyController = createController();
const repo = new MongoPharmacyRepository();

// GET /pharmacies?filter=open|guard|24h
const listRoute = createRoute({
  method: "get",
  path: "/",
  request: {
    query: z.object({
      filter: z.enum(["open", "guard", "24h"]).optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: PharmacyListResponseSchema } },
      description: "Liste des pharmacies",
    },
  },
});

pharmacyController.openapi(listRoute, async (c) => {
  const { filter } = c.req.valid("query");
  const useCase = new GetPharmacies(repo);
  const results = await useCase.execute(filter as any);

  const pharmacies = results.map(({ pharmacy: p, isOpenNow, isOnGuard }) =>
    serializePharmacy(p, { isOpenNow, isOnGuard })
  );

  return c.json({ pharmacies, total: pharmacies.length }, 200);
});

// GET /pharmacies/search?q=...
const searchRoute = createRoute({
  method: "get",
  path: "/search",
  request: {
    query: z.object({ q: z.string().min(1) }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: PharmacySearchResponseSchema } },
      description: "Résultats de recherche",
    },
  },
});

pharmacyController.openapi(searchRoute, async (c) => {
  const { q } = c.req.valid("query");
  const pharmacies = await repo.search(q);
  const results = pharmacies.map((p) => ({
    id: p.id!,
    name: p.props.name,
    city: p.props.city,
  }));
  return c.json({ results }, 200);
});

export default pharmacyController;
