import { Session } from "../../domain/entities/Session";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { SessionModel } from "../models/SessionModel";

export class MongoSessionRepository implements ISessionRepository {
  async save(session: Session): Promise<void> {
    await SessionModel.updateOne(
      { _id: session.id },
      { userId: session.userId, expiresAt: session.expiresAt },
      { upsert: true },
    );
  }

  async delete(id: string): Promise<void> {
    await SessionModel.deleteOne({ _id: id });
  }

  async findById(id: string): Promise<Session | null> {
    const doc = await SessionModel.findById(id).lean();
    if (!doc) return null;

    return new Session({
      id: doc._id,
      userId: doc.userId.toString(),
      expiresAt: doc.expiresAt,
    });
  }
}
