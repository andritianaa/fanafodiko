import { Types } from "mongoose";
import { MedSearch } from "../../domain/entities/MedSearch";
import { MongoMedSearchRepository } from "../../infrastructure/repositories/MedSearchRepository";
import { PharmacyModel } from "../../infrastructure/models/PharmacyModel";
import { PharmacyMembershipModel } from "../../infrastructure/models/PharmacyMembershipModel";
import { sseManager } from "../../infrastructure/sse/SseManager";
import type { CreateMedSearchInput } from "@ext/schemas";

const SEARCH_TTL_MINUTES = 45;

/** km distance between two lat/lng pairs */
function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class CreateMedSearch {
  constructor(private readonly repo: MongoMedSearchRepository) {}

  async execute(input: CreateMedSearchInput, userId: string): Promise<MedSearch> {
    const { lat, lng } = input.coordinates;
    const radiusM = input.radiusKm * 1000;

    // Find nearby pharmacies (active only)
    const nearbyDocs = await PharmacyModel.find({
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiusM,
        },
      },
    })
      .limit(50)
      .lean();

    const allNearby = nearbyDocs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      coordinates: {
        lat: (doc.location as any).coordinates[1],
        lng: (doc.location as any).coordinates[0],
      },
      distance: distanceKm(
        lat, lng,
        (doc.location as any).coordinates[1],
        (doc.location as any).coordinates[0]
      ),
    }));

    // Exclure les pharmacies sans aucun membre assigné :
    // elles ne peuvent pas répondre à la recherche.
    const allIds = allNearby.map((p) => p.id);
    const memberedIds = await PharmacyMembershipModel.distinct("pharmacyId", {
      pharmacyId: { $in: allIds },
    });
    const memberedSet = new Set(memberedIds.map(String));

    const nearbyPharmacies = allNearby.filter((p) => memberedSet.has(p.id));

    const expiresAt = new Date(Date.now() + SEARCH_TTL_MINUTES * 60 * 1000);

    const search = MedSearch.create({
      id: new Types.ObjectId().toString(),
      userId,
      medicationName: input.medicationName,
      coordinates: input.coordinates,
      radiusKm: input.radiusKm,
      note: input.note,
      status: "active",
      nearbyPharmacies,
      expiresAt,
    });

    const saved = await this.repo.save(search);

    // Notify pharmacy staff connected via SSE
    const pharmacyIds = nearbyPharmacies.map((p) => p.id);
    sseManager.notifyPharmacies(pharmacyIds, {
      searchId: saved.id,
      medicationName: input.medicationName,
      note: input.note,
      radiusKm: input.radiusKm,
      coordinates: input.coordinates,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    return saved;
  }
}
