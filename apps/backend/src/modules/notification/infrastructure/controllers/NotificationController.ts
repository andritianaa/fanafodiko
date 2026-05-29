import { createRoute } from "@hono/zod-openapi";
import { createController } from "@/core/api/factory";
import { authMiddleware } from "@/modules/identity/infrastructure/middlewares/AuthMiddleware";
import { JwtTokenService } from "@/modules/identity/infrastructure/security/JwtTokenService";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { MongoTaskRepository } from "@/modules/planning/infrastructure/repositories/MongoTaskRepository";
import { MongoInAppNotificationRepository } from "../repositories/MongoInAppNotificationRepository";
import { ConfirmMedicationIntake } from "../../application/use-cases/ConfirmMedicationIntake";
import { SkipMedicationIntake } from "../../application/use-cases/SkipMedicationIntake";
import { GetDailyProgress } from "../../application/use-cases/GetDailyProgress";
import { GetUnreadNotifications } from "../../application/use-cases/GetUnreadNotifications";
import { MarkNotificationAsRead } from "../../application/use-cases/MarkNotificationAsRead";
import { MarkAllNotificationsAsRead } from "../../application/use-cases/MarkAllNotificationsAsRead";
import { GetNotificationCount } from "../../application/use-cases/GetNotificationCount";
import { MongoProfileRepository } from "@/modules/identity/infrastructure/repositories/ProfileRepository";
import { z } from "zod";
import {
  InAppNotificationListSchema,
  UnreadCountSchema,
  DailyProgressResponseSchema,
  TaskListResponseSchema
} from "@ext/schemas";

const notificationController = createController();

const userRepository = new MongoUserRepository();
const taskRepository = new MongoTaskRepository();
const inAppNotificationRepository = new MongoInAppNotificationRepository();
const profileRepository = new MongoProfileRepository();
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "supersecret-change-me"
);

const confirmMedicationIntakeUseCase = new ConfirmMedicationIntake(taskRepository);
const skipMedicationIntakeUseCase = new SkipMedicationIntake(taskRepository);
const getDailyProgressUseCase = new GetDailyProgress(taskRepository);
const getUnreadNotificationsUseCase = new GetUnreadNotifications(inAppNotificationRepository);
const markNotificationAsReadUseCase = new MarkNotificationAsRead(inAppNotificationRepository);
const markAllNotificationsAsReadUseCase = new MarkAllNotificationsAsRead(inAppNotificationRepository);
const getNotificationCountUseCase = new GetNotificationCount(inAppNotificationRepository);

// Middleware
notificationController.use("*", authMiddleware(tokenService, userRepository));

// Get Tasks by Profile and Date
const getTasksRoute = createRoute({
  method: "get",
  path: "/tasks",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    query: z.object({
      profileId: z.string().optional().openapi({ description: "Profile ID (optional, if omitted fetches all user profiles)" }),
      date: z.string().optional().openapi({ description: "Date in YYYY-MM-DD format (for single day)" }),
      from: z.string().optional().openapi({ description: "Start date in YYYY-MM-DD format" }),
      to: z.string().optional().openapi({ description: "End date in YYYY-MM-DD format" }),
    }),
  },
  responses: {
    200: {
      description: "List of medication tasks",
      content: { "application/json": { schema: TaskListResponseSchema } },
    },
  },
});

notificationController.openapi(getTasksRoute, async (c) => {
  const { profileId, date, from, to } = c.req.valid("query");
  const user = c.get("user");

  let targetProfileIds: string | string[];
  
  if (!profileId || profileId === 'all') {
    const profiles = await profileRepository.findAllByAccountId(user.id!);
    targetProfileIds = profiles.map(p => p.id as string);
  } else {
    targetProfileIds = profileId;
  }

  let tasks;

  if (from || to) {
      const startDate = from ? new Date(from) : undefined;
      const endDate = to ? new Date(to) : undefined;
      // If we have a range, set time to start/end of day if strictly date string, 
      // but assuming input is YYYY-MM-DD, new Date(string) is UTC 00:00.
      // Ideally, 'to' should be end of that day.
      if (endDate) {
          endDate.setHours(23, 59, 59, 999);
      }
      tasks = await taskRepository.findByProfileId(targetProfileIds, startDate, endDate);
  } else {
      const targetDate = date ? new Date(date) : new Date();
      tasks = await taskRepository.findByProfileAndDate(targetProfileIds as any, targetDate);
  }

  const response = tasks.map((task) => ({
    id: task.id!,
    medicationId: task.medicationId,
    profileId: task.profileId,
    scheduledAt: task.scheduledAt.toISOString(),
    status: task.status,
    takenAt: task.takenAt?.toISOString(),
    createdAt: task.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: task.updatedAt?.toISOString() || new Date().toISOString(),
  }));

  // Sort by scheduledAt descending for history if it's a range query (likely dashboard)
  // or maybe just always sort descending? The repository sorts ascending.
  // The user asked for "most recent to oldest" for history.
  // Let's reverse if it's a range query which implies history.
  if (from || to) {
    response.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }

  return c.json(response, 200);
});

// Mark Task as Taken
const markTakenRoute = createRoute({
  method: "patch",
  path: "/tasks/{id}/take",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: "Task ID" }),
    }),
  },
  responses: {
    200: {
      description: "Task marked as taken",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    404: { description: "Task not found" },
  },
});

notificationController.openapi(markTakenRoute, async (c) => {
  const { id } = c.req.valid("param");

  await confirmMedicationIntakeUseCase.execute({ taskId: id });

  return c.json({ message: "Task marked as TAKEN" }, 200);
});

// Mark Task as Skipped
const markSkippedRoute = createRoute({
  method: "patch",
  path: "/tasks/{id}/skip",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: "Task ID" }),
    }),
  },
  responses: {
    200: {
      description: "Task marked as skipped",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    404: { description: "Task not found" },
  },
});

notificationController.openapi(markSkippedRoute, async (c) => {
  const { id } = c.req.valid("param");

  await skipMedicationIntakeUseCase.execute({ taskId: id });

  return c.json({ message: "Task marked as SKIPPED" }, 200);
});

const getDailyProgressRoute = createRoute({
  method: "get",
  path: "/tasks/stats/{profileId}",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({
      profileId: z.string().openapi({ description: "Profile ID" }),
    }),
    query: z.object({
      date: z.string().optional().openapi({ description: "Date in YYYY-MM-DD format" }),
    }),
  },
  responses: {
    200: {
      description: "Daily adherence statistics",
      content: { "application/json": { schema: DailyProgressResponseSchema } },
    },
  },
});

notificationController.openapi(getDailyProgressRoute, async (c) => {
  const { profileId } = c.req.valid("param");
  const { date } = c.req.valid("query");
  const user = c.get("user");

  let targetProfileIds: string | string[];

  if (profileId === 'all') {
    const profiles = await profileRepository.findAllByAccountId(user.id!);
    targetProfileIds = profiles.map(p => p.id as string);
  } else {
    targetProfileIds = profileId;
  }

  const targetDate = date ? new Date(date) : new Date();

  const progress = await getDailyProgressUseCase.execute({
    profileId: targetProfileIds,
    date: targetDate,
  });

  return c.json(progress, 200);
});

// Get Unread Notifications
const getUnreadNotificationsRoute = createRoute({
  method: "get",
  path: "/in-app/{profileId}",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({
      profileId: z.string().openapi({ description: "Profile ID" }),
    }),
  },
  responses: {
    200: {
      description: "List of unread in-app notifications",
      content: { "application/json": { schema: InAppNotificationListSchema } },
    },
  },
});

notificationController.openapi(getUnreadNotificationsRoute, async (c) => {
  const { profileId } = c.req.valid("param");

  const notifications = await getUnreadNotificationsUseCase.execute({ profileId });

  return c.json(notifications, 200);
});

// Get Unread Notification Count
const getUnreadCountRoute = createRoute({
  method: "get",
  path: "/in-app/{profileId}/count",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({
      profileId: z.string().openapi({ description: "Profile ID" }),
    }),
  },
  responses: {
    200: {
      description: "Unread notification count",
      content: { "application/json": { schema: UnreadCountSchema } },
    },
  },
});

notificationController.openapi(getUnreadCountRoute, async (c) => {
  const { profileId } = c.req.valid("param");

  const result = await getNotificationCountUseCase.execute({ profileId });

  return c.json(result, 200);
});

// Mark Notification as Read
const markNotificationReadRoute = createRoute({
  method: "patch",
  path: "/in-app/{id}/read",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: "Notification ID" }),
    }),
  },
  responses: {
    200: {
      description: "Notification marked as read",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    404: { description: "Notification not found" },
  },
});

notificationController.openapi(markNotificationReadRoute, async (c) => {
  const { id } = c.req.valid("param");

  await markNotificationAsReadUseCase.execute({ notificationId: id });

  return c.json({ message: "Notification marked as read" }, 200);
});

// Mark All Notifications as Read
const markAllReadRoute = createRoute({
  method: "patch",
  path: "/in-app/{profileId}/read-all",
  security: [{ AuthorizationApiKey: [] }],
  request: {
    params: z.object({
      profileId: z.string().openapi({ description: "Profile ID" }),
    }),
  },
  responses: {
    200: {
      description: "All notifications marked as read",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
  },
});

notificationController.openapi(markAllReadRoute, async (c) => {
  const { profileId } = c.req.valid("param");

  await markAllNotificationsAsReadUseCase.execute({ profileId });

  return c.json({ message: "All notifications marked as read" }, 200);
});

export default notificationController;
