import { PasswordResetCode } from "../entities/PasswordResetCode";

export interface IResetCodeRepository {
  /**
   * Enregistre un nouveau Code de réinitialisation en base.
   * Si un Code existe déjà pour cet utilisateur, il sera remplacé (upsert).
   */
  save(resetCode: PasswordResetCode): Promise<void>;

  /**
   * Récupère un Code par son ID.
   */
  findById(id: string): Promise<PasswordResetCode | null>;

  /**
   * Récupère un Code par sa valeur brute.
   * Retourne null si le Code n'existe pas ou a été supprimé par le TTL.
   */
  findByCode(code: string): Promise<PasswordResetCode | null>;

  /**
   * Supprime le Code après usage unique.
   */
  delete(code: string): Promise<void>;

  /**
   * Supprime tous les anciens Codes d'un utilisateur
   * avant d'en générer un nouveau.
   */
  deleteByUserId(userId: string): Promise<void>;
}
