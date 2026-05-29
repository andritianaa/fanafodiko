import { createRoute } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "../middlewares/AuthMiddleware";
import { JwtTokenService } from "../security/JwtTokenService";
import { MongoUserRepository } from "../repositories/UserRepository";
import { MongoProfileRepository } from "../repositories/ProfileRepository";
import { GetHouseholdMembers } from "../../application/use-cases/GetHouseholdMembers";
import { AddHouseholdMember } from "../../application/use-cases/AddHouseholdMember";
import { GetProfileDetails } from "../../application/use-cases/GetProfileDetails";
import { UpdateHouseholdMember } from "../../application/use-cases/UpdateHouseholdMember";
import { RemoveHouseholdMember } from "../../application/use-cases/RemoveHouseholdMember";
import {
  CreateHouseholdMemberSchema,
  HouseholdMemberListSchema,
  HouseholdMemberSchema,
  UpdateHouseholdMemberSchema,
} from "@ext/schemas";
import { z } from "zod";

const householdController = createController();

const userRepository = new MongoUserRepository();
const profileRepository = new MongoProfileRepository();
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me",
);

// Instantiate Use Cases
const getHouseholdMembersUseCase = new GetHouseholdMembers(profileRepository);
const addHouseholdMemberUseCase = new AddHouseholdMember(profileRepository);
const getProfileDetailsUseCase = new GetProfileDetails(profileRepository);
const updateHouseholdMemberUseCase = new UpdateHouseholdMember(profileRepository);
const removeHouseholdMemberUseCase = new RemoveHouseholdMember(profileRepository);

// Middleware
householdController.use("*", authMiddleware(tokenService, userRepository));

// Routes
const listMembersRoute = createRoute({
  method: "get",
  path: "/",
  security: [{ AuthorizationApiKey: [] }],
  responses: {
    200: {
      description: "List of household members",
      content: { "application/json": { schema: HouseholdMemberListSchema } },
    },
  },
});

householdController.openapi(listMembersRoute, async (c) => {
  const user = c.get("user");
  const members = await getHouseholdMembersUseCase.execute(user.id!);
  
  // Map domain entities to DTOs/Schema
  const response = members.map((member) => ({
    id: member.id!,
    accountId: member.accountId,
    firstName: member.firstName,
    lastName: member.lastName,
    dateOfBirth: member.dateOfBirth.toISOString(),
    relationship: member.relationship.getValue(),
    avatarUrl: member.avatarUrl,
  }));

  return c.json(response, 200);
});

const addMemberRoute = createRoute({
  method: "post",
  path: "/",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    body: { content: { "application/json": { schema: CreateHouseholdMemberSchema } } },
  },
  responses: {
    201: {
      description: "Member created successfully",
      content: { "application/json": { schema: HouseholdMemberSchema } },
    },
  },
});

householdController.openapi(addMemberRoute, async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");

  const newMember = await addHouseholdMemberUseCase.execute({
    accountId: user.id!,
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: new Date(data.dateOfBirth),
    relationship: data.relationship,
    avatarUrl: data.avatarUrl,
  });

  return c.json(
    {
      id: newMember.id!,
      accountId: newMember.accountId,
      firstName: newMember.firstName,
      lastName: newMember.lastName,
      dateOfBirth: newMember.dateOfBirth.toISOString(),
      relationship: newMember.relationship.getValue(),
      avatarUrl: newMember.avatarUrl,
    },
    201,
  );
});

const getMemberRoute = createRoute({
  method: "get",
  path: "/{id}",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        example: "507f1f77bcf86cd799439011",
        description: "Member ID"
      })
    }),
  },
  responses: {
    200: {
      description: "Member details",
      content: { "application/json": { schema: HouseholdMemberSchema } },
    },
    404: { description: "Member not found" },
  },
});

householdController.openapi(getMemberRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const member = await getProfileDetailsUseCase.execute(user.id!, id);

  return c.json(
    {
      id: member.id!,
      accountId: member.accountId,
      firstName: member.firstName,
      lastName: member.lastName,
      dateOfBirth: member.dateOfBirth.toISOString(),
      relationship: member.relationship.getValue(),
      avatarUrl: member.avatarUrl,
    },
    200,
  );
});

const updateMemberRoute = createRoute({
  method: "patch",
  path: "/{id}",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: UpdateHouseholdMemberSchema } } },
  },
  responses: {
    200: {
      description: "Member updated successfully",
      content: { "application/json": { schema: HouseholdMemberSchema } },
    },
    404: { description: "Member not found" },
  },
});

householdController.openapi(updateMemberRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");

  const updates: any = { ...data };
  if (data.dateOfBirth) {
    updates.dateOfBirth = new Date(data.dateOfBirth);
  }

  const updatedMember = await updateHouseholdMemberUseCase.execute(
    user.id!,
    id,
    updates
  );

  return c.json(
    {
      id: updatedMember.id!,
      accountId: updatedMember.accountId,
      firstName: updatedMember.firstName,
      lastName: updatedMember.lastName,
      dateOfBirth: updatedMember.dateOfBirth.toISOString(),
      relationship: updatedMember.relationship.getValue(),
      avatarUrl: updatedMember.avatarUrl,
    },
    200,
  );
});

const removeMemberRoute = createRoute({
  method: "delete",
  path: "/{id}",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "Member removed successfully",
    },
    400: { description: "Cannot delete owner" },
    404: { description: "Member not found" },
  },
});

householdController.openapi(removeMemberRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  await removeHouseholdMemberUseCase.execute(user.id!, id);

  return c.json({ message: "Member removed successfully" }, 200);
});

export default householdController;
