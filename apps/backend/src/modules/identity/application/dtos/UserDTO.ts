import { UserRole } from "../../domain/value-objects/UserRole";

export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}
