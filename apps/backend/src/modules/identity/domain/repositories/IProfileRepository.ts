import { Profile } from "../entities/Profile";

export interface IProfileRepository {
    /**
     * Sauvegarde un profil (Création ou Mise à jour).
     */
    save(profile: Profile): Promise<void>;

    /**
     * Récupère un profil spécifique.
     */
    findById(id: string): Promise<Profile | null>;

    /**
     * Récupère TOUS les profils gérés par un compte utilisateur (le foyer).
     * @param accountId L'ID du User principal (le responsable).
     */
    findAllByAccountId(accountId: string): Promise<Profile[]>;

    /**
     * Supprime un profil
     */
    delete(id: string): Promise<void>;
}