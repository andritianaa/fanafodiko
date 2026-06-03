import { createRoute, z } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { MongoPharmacyRepository } from "../repositories/PharmacyRepository";
import { GetPharmacies, isPharmacyOpenNow, isPharmacyOnGuard } from "../../application/use-cases/GetPharmacies";
import { serializePharmacy } from "../serializers/pharmacySerializer";
import { AppError } from "@/core/errors/AppError";
import {
  PharmacyListResponseSchema,
  PharmacySearchResponseSchema,
  PharmacySchema,
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

// GET /pharmacies/:id
const getOneRoute = createRoute({
  method: "get",
  path: "/:id",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: PharmacySchema } },
      description: "Détail d'une pharmacie",
    },
    404: { description: "Pharmacie introuvable" },
  },
});

pharmacyController.openapi(getOneRoute, async (c) => {
  const { id } = c.req.valid("param");
  const pharmacy = await repo.findById(id);
  if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");

  const isOnGuard = isPharmacyOnGuard(pharmacy);
  const isOpenNow = isOnGuard || isPharmacyOpenNow(pharmacy);

  return c.json(serializePharmacy(pharmacy, { isOpenNow, isOnGuard }), 200);
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
