import { Types } from "mongoose";
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserMapper } from "../mappers/UserMapper";
import { UserModel } from "../models/UserModel";

export class MongoUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const userDoc = await UserModel.findOne({ email }).lean();
    if (!userDoc) return null;
    
    return UserMapper.toDomain({
      ...userDoc,
      _id: userDoc._id?.toString(),
    });
  }

  async save(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);

    if (!data._id) {
      data._id = new Types.ObjectId().toString();
    }

    const filter = data._id ? { _id: data._id } : { email: data.email };
    await UserModel.updateOne(filter, { $set: data }, { upsert: true });

    return UserMapper.toDomain(data);
  }

  async findById(id: string): Promise<User | null> {
    const userDoc = await UserModel.findById(id).lean();
    if (!userDoc) return null;
    
    return UserMapper.toDomain({
      ...userDoc,
      _id: userDoc._id?.toString(),
    });
  }
}
