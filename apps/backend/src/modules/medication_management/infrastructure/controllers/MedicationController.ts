import { createRoute } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "@/modules/identity/infrastructure/middlewares/AuthMiddleware";
import { JwtTokenService } from "@/modules/identity/infrastructure/security/JwtTokenService";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { MongoProfileRepository } from "@/modules/identity/infrastructure/repositories/ProfileRepository";
import { MongoMedicationRepository } from "../repositories/MongoMedicationRepository";


import { CreateMedication } from "../../application/use-cases/CreateMedication";
import { GetMedicationDetails } from "../../application/use-cases/GetMedicationDetails";
import { ListMedicationsByProfile } from "../../application/use-cases/ListMedicationsByProfile";
import { UpdateMedication } from "../../application/use-cases/UpdateMedication";
import { DeleteMedication } from "../../application/use-cases/DeleteMedication";
import { ToggleMedicationStatus } from "../../application/use-cases/ToggleMedicationStatus";

import {
  CreateMedicationSchema,
  MedicationListSchema,
  MedicationResponseSchema,
  ToggleMedicationStatusSchema,
  UpdateMedicationSchema,
} from "@ext/schemas";
import { z } from "zod";
import { globalEventBus } from "@/core/events/EventBus";

const medicationController = createController();

// Infrastructure Instances
const userRepository = new MongoUserRepository();
const profileRepository = new MongoProfileRepository();
const medicationRepository = new MongoMedicationRepository();
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me"
);

// Use Case Instances
const createMedicationUseCase = new CreateMedication(
  medicationRepository,
  profileRepository,
  globalEventBus
);

const getMedicationDetailsUseCase = new GetMedicationDetails(
  medicationRepository,
  profileRepository
);
const listMedicationsByProfileUseCase = new ListMedicationsByProfile(
  medicationRepository,
  profileRepository
);
const updateMedicationUseCase = new UpdateMedication(
  medicationRepository,
  profileRepository,
  globalEventBus,
);
const deleteMedicationUseCase = new DeleteMedication(
  medicationRepository,
  profileRepository,
  globalEventBus,
);
const toggleMedicationStatusUseCase = new ToggleMedicationStatus(
  medicationRepository,
  profileRepository,
  globalEventBus,
);

// Middleware
medicationController.use("*", authMiddleware(tokenService, userRepository));

// Routes

// Create Medication
const createMedicationRoute = createRoute({
  method: "post",
  path: "/",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateMedicationSchema } },
    },
  },
  responses: {
    201: {
      description: "Medication created successfully",
      content: { "application/json": { schema: MedicationResponseSchema } },
    },
  },
});

medicationController.openapi(createMedicationRoute, async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");

  // Transform string frequency type to enum type required by entity logic (if not done by zod)
  const medication = await createMedicationUseCase.execute({
    userId: user.id!,
    profileId: data.profileId,
    name: data.name,
    dosage: data.dosage,
    frequency: {
      type: data.frequency.type as any,
      times: data.frequency.times,
      days: data.frequency.days,
    },
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    utcOffsetMinutes: data.utcOffsetMinutes ?? 0,
  });

  return c.json(
    {
      id: medication.id!,
      profileId: medication.profileId,
      name: medication.name,
      dosage: medication.dosage,
      frequency: {
        type: medication.frequency.type,
        times: medication.frequency.times,
        days: medication.frequency.days,
      },
      startDate: medication.startDate.toISOString(),
      endDate: medication.endDate?.toISOString() || undefined,
      isActive: medication.isActive,
      utcOffsetMinutes: medication.utcOffsetMinutes,
      createdAt: medication.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: medication.updatedAt?.toISOString() || new Date().toISOString(),
    },
    201
  );
});

// List Medications by Profile
const listByProfileRoute = createRoute({
  method: "get",
  path: "/profile/{profileId}",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({
      profileId: z.string().openapi({ description: "Profile ID" }),
    }),
  },
  responses: {
    200: {
      description: "List of medications for a profile",
      content: { "application/json": { schema: MedicationListSchema } },
    },
  },
});

medicationController.openapi(listByProfileRoute, async (c) => {
  const user = c.get("user");
  const { profileId } = c.req.valid("param");

  let targetProfileId: string | string[];

  if (profileId === "all") {
    const profiles = await profileRepository.findAllByAccountId(user.id!);
    targetProfileId = profiles.map((p) => p.id!);
  } else {
    targetProfileId = profileId;
  }

  const medications = await listMedicationsByProfileUseCase.execute(
    user.id!,
    targetProfileId
  );

  const response = medications.map((med) => ({
    id: med.id!,
    profileId: med.profileId,
    name: med.name,
    dosage: med.dosage,
    frequency: {
      type: med.frequency.type,
      times: med.frequency.times,
      days: med.frequency.days,
    },
    startDate: med.startDate.toISOString(),
    endDate: med.endDate?.toISOString() || undefined,
    isActive: med.isActive,
    createdAt: med.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: med.updatedAt?.toISOString() || new Date().toISOString(),
  }));

  return c.json(response, 200);
});

// Get Medication Details
const getDetailsRoute = createRoute({
  method: "get",
  path: "/{id}",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: "Medication ID" }),
    }),
  },
  responses: {
    200: {
      description: "Medication details",
      content: { "application/json": { schema: MedicationResponseSchema } },
    },
    404: { description: "Medication not found" },
  },
});

medicationController.openapi(getDetailsRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const med = await getMedicationDetailsUseCase.execute(user.id!, id);

  return c.json(
    {
      id: med.id!,
      profileId: med.profileId,
      name: med.name,
      dosage: med.dosage,
      frequency: {
        type: med.frequency.type,
        times: med.frequency.times,
        days: med.frequency.days,
      },
      startDate: med.startDate.toISOString(),
      endDate: med.endDate?.toISOString() || undefined,
      isActive: med.isActive,
      utcOffsetMinutes: med.utcOffsetMinutes,
      createdAt: med.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: med.updatedAt?.toISOString() || new Date().toISOString(),
    },
    200
  );
});

// Update Medication
const updateRoute = createRoute({
  method: "put",
  path: "/{id}",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: { "application/json": { schema: UpdateMedicationSchema } },
    },
  },
  responses: {
    200: {
      description: "Medication updated successfully",
      content: { "application/json": { schema: MedicationResponseSchema } },
    },
  },
});

medicationController.openapi(updateRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");

  const updates: any = {};
  if (data.name) updates.name = data.name;
  if (data.dosage) updates.dosage = data.dosage;
  if (data.startDate) updates.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updates.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.frequency) {
    updates.frequency = {
      type: data.frequency.type as any,
      times: data.frequency.times,
      days: data.frequency.days,
    };
  }
  if (data.utcOffsetMinutes !== undefined) updates.utcOffsetMinutes = data.utcOffsetMinutes;

  const med = await updateMedicationUseCase.execute({
    userId: user.id!,
    medicationId: id,
    updates,
  });

  return c.json(
    {
      id: med.id!,
      profileId: med.profileId,
      name: med.name,
      dosage: med.dosage,
      frequency: {
        type: med.frequency.type,
        times: med.frequency.times,
        days: med.frequency.days,
      },
      startDate: med.startDate.toISOString(),
      endDate: med.endDate?.toISOString() || undefined,
      isActive: med.isActive,
      utcOffsetMinutes: med.utcOffsetMinutes,
      createdAt: med.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: med.updatedAt?.toISOString() || new Date().toISOString(),
    },
    200
  );
});

// Toggle Status
const toggleStatusRoute = createRoute({
  method: "patch",
  path: "/{id}/status",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: { "application/json": { schema: ToggleMedicationStatusSchema } },
    },
  },
  responses: {
    200: {
      description: "Medication status updated",
      content: { "application/json": { schema: MedicationResponseSchema } },
    },
  },
});

medicationController.openapi(toggleStatusRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { isActive } = c.req.valid("json");

  const med = await toggleMedicationStatusUseCase.execute(
    user.id!,
    id,
    isActive
  );

  return c.json(
    {
      id: med.id!,
      profileId: med.profileId,
      name: med.name,
      dosage: med.dosage,
      frequency: {
        type: med.frequency.type,
        times: med.frequency.times,
        days: med.frequency.days,
      },
      startDate: med.startDate.toISOString(),
      endDate: med.endDate?.toISOString() || undefined,
      isActive: med.isActive,
      utcOffsetMinutes: med.utcOffsetMinutes,
      createdAt: med.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: med.updatedAt?.toISOString() || new Date().toISOString(),
    },
    200
  );
});

// Delete Medication
const deleteRoute = createRoute({
  method: "delete",
  path: "/{id}",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "Medication deleted successfully",
    },
  },
});

medicationController.openapi(deleteRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  await deleteMedicationUseCase.execute(user.id!, id);

  return c.json({ message: "Medication deleted successfully" }, 200);
});

// ─── Migration : applique un utcOffsetMinutes à tous les médicaments du compte ─
const fixTimezoneRoute = createRoute({
  method: "post",
  path: "/fix-timezone",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            utcOffsetMinutes: z.number().openapi({
              example: -180,
              description: "Offset à appliquer (ex: -180 pour UTC+3 Madagascar)",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Médicaments mis à jour",
      content: {
        "application/json": {
          schema: z.object({ updated: z.number() }),
        },
      },
    },
  },
});

medicationController.openapi(fixTimezoneRoute, async (c) => {
  const user = c.get("user");
  const { utcOffsetMinutes } = c.req.valid("json");

  // Récupère tous les profils du compte puis tous leurs médicaments
  const profiles = await profileRepository.findAllByAccountId(user.id!);
  const profileIds = profiles.map((p) => p.id!);
  const medications = await medicationRepository.findByProfileId(profileIds);

  let updated = 0;
  for (const med of medications) {
    // Met à jour uniquement les médicaments sans offset correct (utcOffsetMinutes === 0)
    if (med.utcOffsetMinutes !== utcOffsetMinutes) {
      med.update({ utcOffsetMinutes });
      await medicationRepository.save(med);
      updated++;
    }
  }

  return c.json({ updated }, 200);
});

export default medicationController;
