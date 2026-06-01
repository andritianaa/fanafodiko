import { AppError } from "@/core/errors/AppError";
import { MedSearchResponse } from "../../domain/entities/MedSearchResponse";
import { MongoMedSearchRepository } from "../../infrastructure/repositories/MedSearchRepository";
import { sseManager } from "../../infrastructure/sse/SseManager";

export class RespondToSearch {
  constructor(private readonly repo: MongoMedSearchRepository) {}

  async execute(
    searchId: string,
    pharmacyId: string,
    pharmacyName: string,
    respondedByUserId: string,
    hasStock: boolean,
    note?: string
  ): Promise<MedSearchResponse> {
    const search = await this.repo.findById(searchId);
    if (!search) throw new AppError("Recherche introuvable", 404, "NOT_FOUND");
    if (search.status === "closed") {
      throw new AppError("Cette recherche est terminée", 400, "SEARCH_CLOSED");
    }

    const nearbyPharmacy = search.props.nearbyPharmacies.find(
      (p) => p.id === pharmacyId
    );
    if (!nearbyPharmacy) {
      throw new AppError("Pharmacie non concernée par cette recherche", 403, "FORBIDDEN");
    }

    const response = await this.repo.saveResponse(
      MedSearchResponse.create({
        searchId,
        pharmacyId,
        pharmacyName,
        respondedByUserId,
        hasStock,
        note,
        distance: nearbyPharmacy.distance,
      })
    );

    // Notify the searching user in real-time
    sseManager.pushToSearch(searchId, {
      pharmacyId,
      pharmacyName,
      hasStock,
      note,
      distance: nearbyPharmacy.distance,
      respondedAt: response.props.respondedAt?.toISOString() ?? new Date().toISOString(),
    });

    return response;
  }
}
