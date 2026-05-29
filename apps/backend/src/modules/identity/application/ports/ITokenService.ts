export interface ITokenService {
  generate(payload: Record<string, unknown>, expiresIn?: string | number): Promise<string>;
  verify(token: string): Promise<Record<string, unknown>>;
}
