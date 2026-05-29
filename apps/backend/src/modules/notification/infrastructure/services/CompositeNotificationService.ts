import {
  INotificationService,
  NotificationParams,
} from "../../domain/services/INotificationService";

export class CompositeNotificationService implements INotificationService {
  constructor(private readonly services: INotificationService[]) {}

  async send(params: NotificationParams): Promise<void> {
    await Promise.all(this.services.map((service) => service.send(params)));
  }
}
