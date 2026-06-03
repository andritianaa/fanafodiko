import { createRoute, z } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";

const geocodingController = createController();

interface NominatimReverseResult {
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    municipality?: string;
    town?: string;
    city?: string;
    village?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

const reverseRoute = createRoute({
  method: "get",
  path: "/reverse",
  request: {
    query: z.object({
      lat: z.string(),
      lng: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            address: z.string(),
            city: z.string(),
            region: z.string(),
          }),
        },
      },
      description: "Résultat du geocoding inverse",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Coordonnées invalides",
    },
  },
});

geocodingController.openapi(reverseRoute, async (c) => {
  const { lat, lng } = c.req.valid("query");

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return c.json({ message: "Coordonnées invalides" }, 400);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "fr",
        "User-Agent": "Fanafodiko/1.0 (contact@fanafodiko.mg)",
      },
    });

    if (!res.ok) {
      return c.json({ address: "", city: "", region: "" }, 200);
    }

    const data = (await res.json()) as NominatimReverseResult;

    console.log("data ==> ", data);

    const addr = data.address ?? {};

    // Adresse : display_name complet retourné par Nominatim
    const address = data.display_name ?? "";

    // Ville : ordre de priorité pour Madagascar
    const city =
      addr.town ??
      addr.city ??
      addr.village ??
      addr.suburb ??
      addr.municipality ??
      addr.neighbourhood ??
      addr.county ??
      "";

    // Région : état/district pour Madagascar (ex: "Analamanga")
    const region = addr.state_district ?? addr.county ?? addr.state ?? "";

    return c.json({ address, city, region }, 200);
  } catch {
    return c.json({ address: "", city: "", region: "" }, 200);
  }
});

export default geocodingController;
