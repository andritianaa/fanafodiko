import { AppError } from "@/core/errors/AppError";
import { emailSchema } from "@ext/utils";

export class Email {
  private constructor(private readonly value: string) {}
  static create(email: string): Email {
    const result = emailSchema.safeParse(email);

    if (!result.success) {
      throw new AppError(result.error.errors[0].message, 400, "INVALID_EMAIL");
    }
    return new Email(result.data);
  }

  getValue() {
    return this.value;
  }
}
