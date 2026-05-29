import { EventBus } from '@/core/events/EventBus';
import { IMailer } from '@/core/services/mailing/IMailer';

import { setupWelcomeEmailHandler } from '../application/handlers/SendWelcomeEmailHandler';
import { setupSendResetCodeEmailHandler } from '@/modules/identity/application/handlers/SendResetCodeEmailHandler';

export function initIdentityModule(eventBus: EventBus, mailer: IMailer) {
  setupWelcomeEmailHandler(eventBus, mailer);
  setupSendResetCodeEmailHandler(eventBus, mailer);
}
  