import { Profile } from "../../domain/entities/Profile";
import { IProfileRepository } from "../../domain/repositories/IProfileRepository";
import { ProfileMapper } from "../mappers/ProfileMapper";
import { ProfileModel } from "../models/ProfileModel";

export class MongoProfileRepository implements IProfileRepository {
  async save(profile: Profile): Promise<void> {
    const data = ProfileMapper.toPersistence(profile);

    if (profile.id) {
      await ProfileModel.updateOne(
        { _id: profile.id },
        { $set: data },
        { upsert: true }
      );
    } else {
      await ProfileModel.create(data);
    }
  }

  async findById(id: string): Promise<Profile | null> {
    const profileDoc = await ProfileModel.findById(id).lean();
    if (!profileDoc) return null;

    return ProfileMapper.toDomain({
      ...profileDoc,
      _id: profileDoc._id.toString(),
      accountId: profileDoc.accountId.toString(),
    });
  }

  async findAllByAccountId(accountId: string): Promise<Profile[]> {
    const profileDocs = await ProfileModel.find({ accountId }).lean();

    return profileDocs.map((doc) =>
      ProfileMapper.toDomain({
        ...doc,
        _id: doc._id.toString(),
        accountId: doc.accountId.toString(),
      })
    );
  }

  async delete(id: string): Promise<void> {
    await ProfileModel.deleteOne({ _id: id });
  }
}
