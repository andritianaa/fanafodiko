const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

export class ExpoPushService {
  async sendPush(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (tokens.length === 0) return;

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data: data ?? {},
      badge: 1,
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) return;

      const result = (await res.json()) as { data: ExpoTicket[] };
      for (const ticket of result.data ?? []) {
        if (
          ticket.status === "error" &&
          ticket.details?.error === "DeviceNotRegistered"
        ) {
          console.warn(
            "[ExpoPushService] DeviceNotRegistered, token needs cleanup",
          );
        }
      }
    } catch (err) {
      console.error("[ExpoPushService] sendPush error:", err);
    }
  }
}

export const expoPushService = new ExpoPushService();
