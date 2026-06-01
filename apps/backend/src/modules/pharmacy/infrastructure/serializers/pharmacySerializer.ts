import { Pharmacy } from "../../domain/entities/Pharmacy";

/** Sérialise une pharmacie en JSON pour les réponses API (dates ISO). */
export function serializePharmacy(
  p: Pharmacy,
  computed?: { isOpenNow?: boolean; isOnGuard?: boolean }
) {
  return {
    id: p.id!,
    name: p.props.name,
    address: p.props.address,
    landmark: p.props.landmark,
    coordinates: p.props.coordinates,
    phone: p.props.phone,
    contacts: p.props.contacts ?? [],
    images: p.props.images ?? [],
    city: p.props.city,
    region: p.props.region,
    isOpen24h: p.props.isOpen24h,
    openingHours: p.props.openingHours,
    guardSchedules: (p.props.guardSchedules ?? []).map((g) => ({
      weekIdentifier: g.weekIdentifier,
      startDate:
        g.startDate instanceof Date ? g.startDate.toISOString() : String(g.startDate),
      endDate:
        g.endDate instanceof Date ? g.endDate.toISOString() : String(g.endDate),
      isActive: g.isActive,
    })),
    ...(computed?.isOpenNow !== undefined ? { isOpenNow: computed.isOpenNow } : {}),
    ...(computed?.isOnGuard !== undefined ? { isOnGuard: computed.isOnGuard } : {}),
  };
}
