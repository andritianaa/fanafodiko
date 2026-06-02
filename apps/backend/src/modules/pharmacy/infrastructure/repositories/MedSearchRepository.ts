import { Types } from "mongoose";
import { MedSearch, NearbyPharmacy } from "../../domain/entities/MedSearch";
import { MedSearchResponse } from "../../domain/entities/MedSearchResponse";
import { MedSearchModel, MedSearchResponseModel } from "../models/MedSearchModel";

function searchToDomain(doc: any): MedSearch {
  return MedSearch.reconstitute({
    id: doc._id?.toString(),
    userId: doc.userId,
    medicationName: doc.medicationName,
    coordinates: { lat: doc.location.coordinates[1], lng: doc.location.coordinates[0] },
    radiusKm: doc.radiusKm,
    note: doc.note,
    status: doc.status,
    nearbyPharmacies: doc.nearbyPharmacies ?? [],
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
  });
}

function responseToDomain(doc: any): MedSearchResponse {
  return MedSearchResponse.reconstitute({
    id: doc._id?.toString(),
    searchId: doc.searchId,
    pharmacyId: doc.pharmacyId,
    pharmacyName: doc.pharmacyName,
    respondedByUserId: doc.respondedByUserId,
    hasStock: doc.hasStock,
    note: doc.note,
    distance: doc.distance,
    respondedAt: doc.respondedAt,
  });
}

export class MongoMedSearchRepository {
  async save(search: MedSearch): Promise<MedSearch> {
    const id = search.id || new Types.ObjectId().toString();
    await MedSearchModel.updateOne(
      { _id: id },
      {
        $set: {
          _id: id,
          userId: search.props.userId,
          medicationName: search.props.medicationName,
          location: {
            type: "Point",
            coordinates: [search.props.coordinates.lng, search.props.coordinates.lat],
          },
          radiusKm: search.props.radiusKm,
          note: search.props.note,
          status: search.props.status,
          nearbyPharmacies: search.props.nearbyPharmacies,
          expiresAt: search.props.expiresAt,
        },
      },
      { upsert: true }
    );
    return MedSearch.reconstitute({ ...search.props, id });
  }

  async findById(id: string): Promise<MedSearch | null> {
    const doc = await MedSearchModel.findById(id).lean();
    return doc ? searchToDomain(doc) : null;
  }

  async update(search: MedSearch): Promise<void> {
    await MedSearchModel.updateOne({ _id: search.id }, { $set: { status: search.status } });
  }

  // ── Responses ────────────────────────────────────────────────────────────────

  async saveResponse(response: MedSearchResponse): Promise<MedSearchResponse> {
    const id = response.id || new Types.ObjectId().toString();
    await MedSearchResponseModel.updateOne(
      { searchId: response.searchId, pharmacyId: response.pharmacyId },
      {
        $set: {
          _id: id,
          searchId: response.props.searchId,
          pharmacyId: response.props.pharmacyId,
          pharmacyName: response.props.pharmacyName,
          respondedByUserId: response.props.respondedByUserId,
          hasStock: response.props.hasStock,
          note: response.props.note,
          distance: response.props.distance,
          respondedAt: response.props.respondedAt,
        },
      },
      { upsert: true }
    );
    return MedSearchResponse.reconstitute({ ...response.props, id });
  }

  async findResponsesBySearch(searchId: string): Promise<MedSearchResponse[]> {
    const docs = await MedSearchResponseModel.find({ searchId }).lean();
    return docs.map(responseToDomain);
  }

  async findResponseByPharmacy(searchId: string, pharmacyId: string): Promise<MedSearchResponse | null> {
    const doc = await MedSearchResponseModel.findOne({ searchId, pharmacyId }).lean();
    return doc ? responseToDomain(doc) : null;
  }

  async findHistoryForPharmacy(pharmacyId: string): Promise<
    Array<{
      searchId: string;
      medicationName: string;
      radiusKm: number;
      note?: string;
      createdAt: string;
      hasStock: boolean | null;
      respondedAt: string | null;
    }>
  > {
    const docs = await MedSearchModel.find({ "nearbyPharmacies.id": pharmacyId })
      .sort({ createdAt: -1 })
      .lean();
    if (docs.length === 0) return [];

    const ids = docs.map((d) => d._id.toString());
    const responses = await MedSearchResponseModel.find({
      searchId: { $in: ids },
      pharmacyId,
    }).lean();

    const responseMap = new Map(responses.map((r) => [r.searchId.toString(), r]));

    return docs.map((doc) => {
      const r = responseMap.get(doc._id.toString());
      return {
        searchId: doc._id.toString(),
        medicationName: doc.medicationName,
        radiusKm: doc.radiusKm,
        note: doc.note ?? undefined,
        createdAt: (doc.createdAt as Date)?.toISOString() ?? new Date().toISOString(),
        hasStock: r ? r.hasStock : null,
        respondedAt: r?.respondedAt ? (r.respondedAt as Date).toISOString() : null,
      };
    });
  }

  async findHistoryByUserId(userId: string): Promise<
    Array<{
      id: string;
      medicationName: string;
      radiusKm: number;
      note?: string;
      status: string;
      createdAt: string;
      expiresAt: string;
      nearbyCount: number;
      respondedCount: number;
      hasAvailable: boolean;
    }>
  > {
    const docs = await MedSearchModel.find({ userId }).sort({ createdAt: -1 }).lean();
    if (docs.length === 0) return [];

    const ids = docs.map((d) => d._id.toString());
    const responses = await MedSearchResponseModel.find({ searchId: { $in: ids } })
      .select("searchId hasStock")
      .lean();

    const responseMap = new Map<string, { count: number; hasAvailable: boolean }>();
    for (const r of responses) {
      const sid = r.searchId.toString();
      const cur = responseMap.get(sid) ?? { count: 0, hasAvailable: false };
      responseMap.set(sid, {
        count: cur.count + 1,
        hasAvailable: cur.hasAvailable || r.hasStock === true,
      });
    }

    return docs.map((doc) => {
      const id = doc._id.toString();
      const stats = responseMap.get(id) ?? { count: 0, hasAvailable: false };
      return {
        id,
        medicationName: doc.medicationName,
        radiusKm: doc.radiusKm,
        note: doc.note ?? undefined,
        status: doc.status,
        createdAt: (doc.createdAt as Date)?.toISOString() ?? new Date().toISOString(),
        expiresAt: doc.expiresAt?.toISOString() ?? new Date().toISOString(),
        nearbyCount: (doc.nearbyPharmacies ?? []).length,
        respondedCount: stats.count,
        hasAvailable: stats.hasAvailable,
      };
    });
  }

  async findActivePendingForPharmacy(pharmacyId: string): Promise<MedSearch[]> {
    const docs = await MedSearchModel.find({
      "nearbyPharmacies.id": pharmacyId,
      status: "active",
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();
    if (docs.length === 0) return [];

    // Exclure celles auxquelles la pharmacie a déjà répondu
    const ids = docs.map((d) => d._id.toString());
    const responses = await MedSearchResponseModel.find({
      searchId: { $in: ids },
      pharmacyId,
    })
      .select("searchId")
      .lean();
    const respondedIds = new Set(responses.map((r) => r.searchId.toString()));
    return docs.filter((d) => !respondedIds.has(d._id.toString())).map(searchToDomain);
  }
}
