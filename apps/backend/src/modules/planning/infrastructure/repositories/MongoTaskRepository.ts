import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { MedicationTask, TaskStatus } from "../../domain/entities/MedicationTask";
import { MedicationTaskModel, IMedicationTaskDocument } from "../models/MedicationTaskSchema";
import { AppError } from "@/core/errors/AppError";

export class MongoTaskRepository implements ITaskRepository {
  
  private toDomain(doc: IMedicationTaskDocument): MedicationTask {
    return MedicationTask.reconstitute({
      id: doc._id.toString(),
      medicationId: doc.medicationId,
      profileId: doc.profileId,
      scheduledAt: doc.scheduledAt,
      status: doc.status as TaskStatus,
      takenAt: doc.takenAt,
      notifiedAt: doc.notifiedAt,
      uniqueHash: doc.uniqueHash,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toPersistence(task: MedicationTask): Partial<IMedicationTaskDocument> {
    return {
      medicationId: task.medicationId,
      profileId: task.profileId,
      scheduledAt: task.scheduledAt,
      status: task.status,
      takenAt: task.takenAt,
      notifiedAt: task.notifiedAt,
      uniqueHash: task.uniqueHash,
    };
  }

  async save(task: MedicationTask): Promise<MedicationTask> {
    const data = this.toPersistence(task);
    
    if (task.id) {
      const doc = await MedicationTaskModel.findByIdAndUpdate(task.id, data, { new: true });
      if (!doc) throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
      return this.toDomain(doc);
    }

    try {
      const doc = await MedicationTaskModel.create(data);
      return this.toDomain(doc);
    } catch (error: any) {
      if (error.code === 11000) throw new AppError("Task already exists", 409, "TASK_ALREADY_EXISTS");
      throw error;
    }
  }


  async saveMany(tasks: MedicationTask[]): Promise<void> {
    if (tasks.length === 0) return;
    
    // We use bulkWrite to handle duplicates gracefully
    const ops = tasks.map(task => ({
      updateOne: {
        filter: { medicationId: task.medicationId, scheduledAt: task.scheduledAt },
        update: { $setOnInsert: this.toPersistence(task) }, // Only insert if not exists
        upsert: true
      }
    }));

    await MedicationTaskModel.bulkWrite(ops);
  }

  async findById(id: string): Promise<MedicationTask | null> {
    const doc = await MedicationTaskModel.findById(id);
    return doc ? this.toDomain(doc) : null;
  }

  async findByProfileId(profileId: string | string[], startDate?: Date, endDate?: Date): Promise<MedicationTask[]> {
    const query: any = { profileId: Array.isArray(profileId) ? { $in: profileId } : profileId };
    
    if (startDate || endDate) {
      query.scheduledAt = {};
      if (startDate) query.scheduledAt.$gte = startDate;
      if (endDate) query.scheduledAt.$lte = endDate;
    }

    const docs = await MedicationTaskModel.find(query).sort({ scheduledAt: 1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findPendingBefore(date: Date): Promise<MedicationTask[]> {
    const docs = await MedicationTaskModel.find({
      status: TaskStatus.PENDING,
      scheduledAt: { $lt: date }
    });
    return docs.map(doc => this.toDomain(doc));
  }

  async findByHash(hash: string): Promise<MedicationTask | null> {
    const doc = await MedicationTaskModel.findOne({ uniqueHash: hash });
    return doc ? this.toDomain(doc) : null;
  }

  // Notification methods
  async findTasksToNotify(currentTime: Date): Promise<MedicationTask[]> {
    // Only return tasks that have never been notified (notifiedAt absent or null).
    // This guarantees each scheduled dose triggers exactly one email/push notification.
    const docs = await MedicationTaskModel.find({
      status: TaskStatus.PENDING,
      scheduledAt: { $lte: currentTime },
      notifiedAt: { $exists: false },
    }).sort({ scheduledAt: 1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findOverdueTasks(limitTime: Date): Promise<MedicationTask[]> {
    const docs = await MedicationTaskModel.find({
      status: TaskStatus.PENDING,
      scheduledAt: { $lt: limitTime }
    }).sort({ scheduledAt: 1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findByProfileAndDate(profileId: string, date: Date): Promise<MedicationTask[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const docs = await MedicationTaskModel.find({
      profileId: Array.isArray(profileId) ? { $in: profileId } : profileId,
      scheduledAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ scheduledAt: 1 });
    
    return docs.map(doc => this.toDomain(doc));
  }
}
