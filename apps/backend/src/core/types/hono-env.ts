import { User } from "@/modules/identity/domain/entities/User";

export type HonoEnv = {
  Variables: {
    user: User;
    // Membership chargée par PharmacyRoleMiddleware sur les routes /my/pharmacies/:id/*
    pharmacyMembership?: {
      pharmacyId: string;
      userId: string;
      role: "superadmin" | "admin" | "staff";
    };
  };
};
