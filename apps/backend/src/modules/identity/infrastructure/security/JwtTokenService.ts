import { sign, verify } from "hono/jwt";
import { ITokenService } from "../../application/ports/ITokenService";

export class JwtTokenService implements ITokenService {
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  async generate(
    payload: Record<string, unknown>,
    expiresIn: string | number = "1h",
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    let exp = payload.exp as number | undefined;

    if (!exp) {
      let seconds = 3600; // Default 1h
      if (typeof expiresIn === "number") {
        seconds = expiresIn;
      } else if (typeof expiresIn === "string") {
        const value = Number.parseInt(expiresIn);
        if (expiresIn.endsWith("h")) seconds = value * 3600;
        else if (expiresIn.endsWith("d")) seconds = value * 86400;
        else if (expiresIn.endsWith("m")) seconds = value * 60;
        else seconds = value; // Assume seconds if no suffix
      }
      exp = now + seconds;
    }

    const tokenPayload = {
      ...payload,
      exp,
      iat: now,
    };

    return await sign(tokenPayload, this.secret);
  }

  async verify(token: string): Promise<Record<string, unknown>> {
    try {
      const payload = await verify(token, this.secret, "HS256");
      return payload as Record<string, unknown>;
    } catch {
      throw new Error("Invalid token");
    }
  }
}
