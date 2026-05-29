import { AppError } from "@/core/errors/AppError";

export type RelationshipType = "self" | "child" | "parent" | "other" | "spouse" | "sibling";

const VALID_RELATIONSHIPS: RelationshipType[] = ["self", "child", "parent", "other", "spouse", "sibling"];

export class Relationship {
  private constructor(private readonly value: RelationshipType) {}

  static create(relationship: string): Relationship {
    if (!VALID_RELATIONSHIPS.includes(relationship as RelationshipType)) {
      throw new AppError(
        `Invalid relationship type. Must be one of: ${VALID_RELATIONSHIPS.join(", ")}`,
        400,
        "INVALID_RELATIONSHIP"
      );
    }
    return new Relationship(relationship as RelationshipType);
  }

  getValue(): RelationshipType {
    return this.value;
  }

  isSelf(): boolean {
    return this.value === "self";
  }

  isChild(): boolean {
    return this.value === "child";
  }

  isParent(): boolean {
    return this.value === "parent";
  }

  isOther(): boolean {
    return this.value === "other";
  }

  isSpouse(): boolean {
    return this.value === "spouse";
  }

  isSibling(): boolean {
    return this.value === "sibling";
  }
}
