import { PasswordResetCode } from "../../domain/entities/PasswordResetCode";
import { IResetCodeRepository } from "../../domain/repositories/IResetPasswordRepository";
import { ResetCodeModel } from "../models/ResetCodeModel";

export class MongoResetPasswordRepository implements IResetCodeRepository {
  async save(resetCode: PasswordResetCode): Promise<void> {
    await ResetCodeModel.updateOne(
      { _id: resetCode.id },
      {
        _id: resetCode.id,
        code: resetCode.code,
        userId: resetCode.userId,
        expiresAt: resetCode.expiresAt,
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<PasswordResetCode | null> {
    const doc = await ResetCodeModel.findById(id).lean();
    if (!doc) return null;

    return PasswordResetCode.reconstitute({
      id: doc._id,
      code: doc.code,
      userId: doc.userId.toString(),
      expiresAt: doc.expiresAt,
    });
  }

  async findByCode(code: string): Promise<PasswordResetCode | null> {
    const doc = await ResetCodeModel.findOne({ code }).lean();
    if (!doc) return null;

    return PasswordResetCode.reconstitute({
      id: doc._id,
      code: doc.code,
      userId: doc.userId.toString(),
      expiresAt: doc.expiresAt,
    });
  }

  async delete(code: string): Promise<void> {
    await ResetCodeModel.deleteOne({ code });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await ResetCodeModel.deleteMany({ userId });
  }
}
