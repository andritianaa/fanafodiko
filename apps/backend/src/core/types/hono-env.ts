import { User } from "@/modules/identity/domain/entities/User";

export type HonoEnv = {
  Variables: {
    user: User;
  };
};
